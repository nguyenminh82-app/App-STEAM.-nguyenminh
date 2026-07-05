import { ActivityPlan, AgeGroup, ModelType } from "./types";

// Local Storage Keys
const LOCAL_STORAGE_KEY = "savedActivities_steam";

export function getPlansFromLocalStorage(): ActivityPlan[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse saved activities", e);
    return [];
  }
}

export function savePlanToLocalStorage(plan: ActivityPlan): void {
  try {
    const current = getPlansFromLocalStorage();
    // Prevent duplicate IDs
    const index = current.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      current[index] = plan;
    } else {
      current.unshift(plan);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save activity", e);
  }
}

export function deletePlanFromLocalStorage(id: string): void {
  try {
    const current = getPlansFromLocalStorage();
    const filtered = current.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete activity", e);
  }
}

// Curated Preschool STEAM Templates
export interface SteamTemplate {
  name: string;
  topic: string;
  age: AgeGroup;
  model: ModelType;
  duration: string;
  description: string;
  icon: string;
}

export const STEAM_TEMPLATES: SteamTemplate[] = [
  {
    name: "Hệ thống lọc nước mini",
    topic: "Nước và môi trường",
    age: "5-6 tuổi",
    model: "EDP",
    duration: "35 phút",
    description: "Thiết kế và lắp ráp bộ lọc nước đơn giản từ chai nhựa, cát, sỏi, bông gòn để làm sạch nước đục.",
    icon: "💧",
  },
  {
    name: "Sự chìm nổi kỳ diệu của quả quýt",
    topic: "Khám phá Khoa học",
    age: "4-5 tuổi",
    model: "5E",
    duration: "30 phút",
    description: "Thí nghiệm khám phá tại sao quả quýt có vỏ thì nổi, bóc vỏ lại chìm, khơi dậy óc phán đoán khoa học.",
    icon: "🍊",
  },
  {
    name: "Cây cầu chịu lực từ que kem",
    topic: "Xây dựng & Kiến trúc",
    age: "5-6 tuổi",
    model: "EDP",
    duration: "40 phút",
    description: "Thử thách thiết kế cây cầu có cấu trúc vững chắc từ que gỗ và keo sữa để nâng đỡ những chiếc ô tô đồ chơi.",
    icon: "🌉",
  },
  {
    name: "Bản nhạc sắc màu từ cốc nước",
    topic: "Âm thanh & Thẩm mỹ",
    age: "3-4 tuổi",
    model: "5E",
    duration: "30 phút",
    description: "Tạo nhạc cụ gõ bằng cách đổ nước với độ cao khác nhau vào các cốc thủy tinh pha màu, học về cao độ âm thanh.",
    icon: "🎵",
  },
  {
    name: "Chiếc ô che mưa cho búp bê",
    topic: "Thời tiết & Sáng chế",
    age: "4-5 tuổi",
    model: "EDP",
    duration: "30 phút",
    description: "Sử dụng đĩa giấy, ống hút, nilon để thiết kế chiếc ô chống thấm nước bảo vệ búp bê dưới vòi phun mưa.",
    icon: "☔",
  },
];

// Helper to convert File to base64 or text
export function readFileAsTextOrBase64(file: File): Promise<{ content: string; isText: boolean }> {
  return new Promise((resolve, reject) => {
    const isTextFile = file.type.startsWith("text/") || 
                     file.name.endsWith(".txt") || 
                     file.name.endsWith(".json") ||
                     file.name.endsWith(".csv") ||
                     file.name.endsWith(".md");
    
    const reader = new FileReader();
    
    if (isTextFile) {
      reader.onload = (e) => {
        resolve({
          content: e.target?.result as string || "",
          isText: true
        });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    } else {
      // For images or doc files, we read as DataURL (base64)
      reader.onload = (e) => {
        const result = e.target?.result as string || "";
        // Extract raw base64 if needed, or keep as base64 string
        resolve({
          content: result,
          isText: false
        });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    }
  });
}
