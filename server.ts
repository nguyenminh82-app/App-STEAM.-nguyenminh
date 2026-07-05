import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request body limits to support large base64 strings or files
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize Google Gen AI Client lazily to prevent crashing if key is missing on startup
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// STEAM 5E/EDP Generation API Endpoint
app.post("/api/generate-plan", async (req, res) => {
  try {
    const { topic, name, age, model, duration, request, currentPlanContent, fileName, fileContent } = req.body;

    if (!topic || !name || !age || !model || !duration) {
      return res.status(400).json({ error: "Missing required fields: topic, name, age, model, duration" });
    }

    const ai = getAiClient();

    // Construct step guidelines for prompt
    let stepGuideline = "";
    if (model === "5E") {
      stepGuideline = `
- **Gắn kết (Engage)**: Gây hứng thú cho trẻ, thu hút sự chú ý và khơi gợi tò mò (sử dụng câu đố, câu chuyện, trò chơi hoặc video ngắn). Đặt câu hỏi kích thích suy nghĩ của trẻ về chủ đề.
- **Khám phá (Explore)**: Trẻ được thực hành trải nghiệm, tìm tòi, sờ nắn, làm thử nghiệm tự do dưới sự hỗ trợ từ xa của giáo viên. Giáo viên đóng vai trò là người quan sát và hỗ trợ khi cần, không giảng giải trước.
- **Giải thích (Explain)**: Trẻ tự chia sẻ những phát hiện hoặc kết quả sau khi khám phá. Giáo viên giúp trẻ hệ thống hóa kiến thức, đúc kết ngắn gọn bằng các từ ngữ dễ hiểu và phương tiện trực quan sinh động.
- **Áp dụng/Củng cố (Elaborate)**: Trẻ áp dụng những kiến thức, kỹ năng vừa học vào giải quyết một thử thách mới hoặc mở rộng sáng tạo (ví dụ chế tạo sản phẩm, trò chơi vận dụng...).
- **Đánh giá (Evaluate)**: Giáo viên cùng trẻ nhìn nhận lại quá trình, thảo luận về sản phẩm hoặc bài học, trẻ tự nhận xét và bày tỏ cảm xúc. Giáo viên ghi nhận nỗ lực của trẻ.
`;
    } else {
      stepGuideline = `
- **Xác định vấn đề (Ask)**: Giáo viên đưa ra tình huống thực tiễn sinh động, lồng ghép nhân vật ngộ nghĩnh (ví dụ: giúp gấu bông chế tạo xe vượt dốc, giúp thỏ ngọc qua sông...) để trẻ phát hiện vấn đề cần giải quyết. Thảo luận các tiêu chí cần đạt của sản phẩm.
- **Tưởng tượng/Phác thảo (Imagine)**: Trẻ tự suy nghĩ giải pháp độc lập, đưa ra các ý tưởng sáng tạo và thực hiện vẽ bản thiết kế/bản phác thảo sản phẩm trên giấy cá nhân hoặc theo nhóm.
- **Lên kế hoạch (Plan)**: Nhóm trẻ ngồi lại thảo luận, lựa chọn nguyên vật liệu phù hợp từ các rổ đồ dùng (giấy, chai lọ tái chế, ống hút, keo dán...), phân công công việc cụ thể cho từng thành viên.
- **Chế tạo/Thử nghiệm (Create)**: Trẻ thực hiện chế tạo sản phẩm theo bản thiết kế. Sau khi hoàn thành, tiến hành kiểm tra thử xem sản phẩm có đáp ứng đúng tiêu chí kỹ thuật đặt ra hay không (ví dụ: thuyền có nổi được không, cầu có giữ được đồ nặng không).
- **Cải tiến/Hoàn thiện (Improve)**: Trẻ tự đánh giá, chia sẻ những lỗi gặp phải, điều chỉnh thiết kế, sửa chữa lỗi chế tạo để hoàn thiện sản phẩm tối ưu và trang trí thêm phần nghệ thuật. Thuyết trình ngắn gọn về sản phẩm của đội mình trước lớp.
`;
    }

    // Handle attached document context
    let fileContext = "";
    if (fileName) {
      fileContext = `
[Đặc biệt lưu ý] Trẻ hoặc cô giáo có gửi kèm tệp tài liệu hỗ trợ mang tên: "${fileName}".
`;
      if (fileContent) {
        fileContext += `Nội dung trích xuất từ tệp này:
"""
${fileContent}
"""
Hãy nghiên cứu thật kỹ nội dung tài liệu này và tích hợp khéo léo các phương pháp, ý tưởng hoặc kiến thức từ tài liệu vào giáo án STEAM đang soạn thảo.
`;
      }
    }

    // Handle modification request vs new generation prompt
    let editRequestContext = "";
    if (request && currentPlanContent) {
      editRequestContext = `
[Yêu cầu cải tiến của giáo viên]: "${request}"
Giáo viên muốn điều chỉnh giáo án hiện tại. Dưới đây là nội dung giáo án gốc đang có:
"""
${currentPlanContent}
"""
Hãy giữ nguyên cấu trúc khoa học của giáo án, nhưng tập trung thực hiện sửa đổi, bổ sung và viết lại chi tiết các phần dựa theo yêu cầu chỉnh sửa ở trên để mang lại một giáo án mới hoàn hảo nhất.
`;
    } else if (request) {
      editRequestContext = `
[Yêu cầu bổ sung đặc biệt cho giáo án]: "${request}". Hãy chú ý lồng ghép nội dung này vào trong quá trình thiết kế giáo án mới.
`;
    }

    const systemInstruction = `Bạn là một chuyên gia giáo dục mầm non hàng đầu Việt Nam, cực kỳ am hiểu phương pháp dạy học STEAM (Science - Technology - Engineering - Art - Math) dành cho trẻ lứa tuổi mầm non (3-4, 4-5, 5-6 tuổi).
Nhiệm vụ của bạn là soạn thảo một giáo án (kế hoạch hoạt động) STEAM mầm non đạt chuẩn, sinh động, thực tế, cực kỳ chi tiết từng lời thoại sư phạm của cô và hành động của trẻ.
Khi viết giáo án:
1. Đảm bảo ngôn từ mầm non gần gũi, dịu dàng, mang tính khích lệ, sáng tạo và lấy trẻ làm trung tâm.
2. Ghi rõ các yếu tố STEAM (S, T, E, A, M) được tích hợp trong hoạt động.
3. Cung cấp chi tiết các câu hỏi mở (ví dụ: 'Theo con thì...', 'Làm thế nào để...', 'Điều gì xảy ra nếu...').
4. Viết bằng tiếng Việt chuẩn, súc tích nhưng đầy đủ chi tiết, tránh nói chung chung.
5. Luôn định dạng nội dung rõ ràng, phân cấp khoa học bằng Markdown (sử dụng h2 cho phần lớn, h3 cho các bước, in đậm, danh sách dấu đầu dòng).`;

    const prompt = `Hãy thiết kế kế hoạch hoạt động STEAM mầm non chi tiết sau đây:
- **Tên hoạt động**: ${name}
- **Chủ đề**: ${topic}
- **Độ tuổi**: ${age}
- **Thời lượng**: ${duration}
- **Mô hình giáo dục**: Mô hình ${model === "5E" ? "5E (Engage - Explore - Explain - Elaborate - Evaluate)" : "EDP (Quy trình thiết kế kỹ thuật - Engineering Design Process)"}

${fileContext}
${editRequestContext}

Hãy trả về một bản giáo án hoàn chỉnh, chi tiết bằng tiếng Việt theo bố cục chuẩn sau:
## I. Mục tiêu hoạt động (Objectives)
- **Kiến thức**: Trẻ nhận biết, hiểu được những gì?
- **Kỹ năng**: Trẻ rèn luyện những kỹ năng thực hành, tư duy, ngôn ngữ, hoạt động nhóm nào?
- **Thái độ**: Thái độ hợp tác, tập trung, vui vẻ, tôn trọng sản phẩm.
- **Yếu tố STEAM tích hợp**:
  - *Khoa học (S)*: ...
  - *Công nghệ (T)*: ... (bao gồm cả công cụ thô sơ kéo, băng dính, dụng cụ gắp...)
  - *Kỹ thuật (E)*: ...
  - *Nghệ thuật (A)*: ... (thẩm mỹ, thiết kế, vẽ phác thảo, trang trí)
  - *Toán học (M)*: ... (đo đạc, đếm, so sánh kích thước, đếm hình khối)

## II. Chuẩn bị (Preparation)
- **Đồ dùng của cô**: ...
- **Đồ dùng của trẻ**: ... (khuyến khích đồ dùng dễ tìm, an toàn, thiên nhiên, tái chế)

## III. Tiến trình hoạt động (Activity Process)
Trình bày chi tiết từng bước theo mô hình ${model}:
${stepGuideline}

## IV. Đánh giá hoạt động (Assessment)
- Tiêu chí đánh giá mức độ đạt được của trẻ (về kiến thức, kỹ năng thực hiện, thái độ tham gia).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const planText = response.text || "Không có nội dung được tạo từ trợ lý AI. Vui lòng thử lại.";

    res.json({ content: planText });
  } catch (error: any) {
    console.error("Gemini AI generation error:", error);
    res.status(500).json({ error: error.message || "Lỗi kết nối AI hoặc cấu hình API Key chưa đúng." });
  }
});

// Configure Vite middleware and static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
