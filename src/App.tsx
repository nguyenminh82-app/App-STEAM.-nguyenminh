import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  FolderOpen, 
  Edit3, 
  Plus, 
  Trash2, 
  Printer, 
  ArrowLeft, 
  Check, 
  Copy, 
  Loader2, 
  FileText, 
  CloudUpload, 
  Download, 
  BookOpen, 
  Lightbulb, 
  Clock, 
  ChevronRight, 
  FileDown, 
  X, 
  RefreshCw, 
  Save, 
  BrainCircuit,
  MessageSquare,
  Eye,
  CheckCircle,
  HelpCircle,
  FolderHeart,
  ChevronDown,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { ActivityPlan, AgeGroup, ModelType } from "./types";
import { 
  getPlansFromLocalStorage, 
  savePlanToLocalStorage, 
  deletePlanFromLocalStorage, 
  STEAM_TEMPLATES, 
  readFileAsTextOrBase64 
} from "./utils";

const LOADING_MESSAGES = [
  "Trợ lý AI đang nghiên cứu chủ đề và phân tích đặc điểm tâm sinh lý lứa tuổi...",
  "Đang xây dựng mục tiêu phát triển toàn diện (Kiến thức - Kỹ năng - Thái độ)...",
  "Đang nghiên cứu và tích hợp khéo léo 5 yếu tố S-T-E-A-M vào bài học...",
  "Đang gợi ý các nguyên vật liệu mầm non trực quan, an toàn, dễ tìm và thân thiện môi trường...",
  "Đang soạn thảo chi tiết tiến trình sư phạm từng bước một cực kỳ sinh động...",
  "Đang biên soạn hệ thống câu hỏi gợi mở, kích thích tư duy phản biện cho trẻ...",
  "Đang hoàn thiện các tiêu chí đánh giá đo lường kết quả rèn luyện của bé..."
];

export default function App() {
  // Screen views: 'dashboard' | 'create' | 'library' | 'view_plan'
  const [screen, setScreen] = useState<"dashboard" | "create" | "library" | "view_plan">("dashboard");
  const [savedPlans, setSavedPlans] = useState<ActivityPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ActivityPlan | null>(null);

  // Form State
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState<AgeGroup>("5-6 tuổi");
  const [model, setModel] = useState<ModelType>("5E");
  const [duration, setDuration] = useState("30 phút");
  const [request, setRequest] = useState("");
  const [useAi, setUseAi] = useState(true);
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileContent, setUploadedFileContent] = useState("");

  // Plan viewer state
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [editableContent, setEditableContent] = useState("");
  const [copied, setCopied] = useState(false);
  
  // AI Refinement state inside plan viewer
  const [refinementRequest, setRefinementRequest] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // General Loading State
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Load Saved Activities on mount
  useEffect(() => {
    const plans = getPlansFromLocalStorage();
    setSavedPlans(plans);
  }, []);

  // Interval for changing loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating || isRefining) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating, isRefining]);

  // Topic Quick Suggestions
  const QUICK_TOPICS = [
    { label: "💧 Nước & Không khí", value: "Nước và sự kỳ diệu của không khí" },
    { label: "🌱 Thế giới Thực vật", value: "Sự phát triển của cây xanh và lá" },
    { label: "🐝 Côn trùng & Động vật", value: "Thế giới động vật quanh bé" },
    { label: "🚗 Giao thông công cộng", value: "Phương tiện giao thông và an toàn" },
    { label: "🌌 Vũ trụ & Thời tiết", value: "Bốn mùa và các hiện tượng tự nhiên" },
    { label: "🏗️ Xây dựng công trình", value: "Cấu trúc chịu lực và kiến trúc" }
  ];

  const QUICK_DURATIONS = ["20 phút", "25 phút", "30 phút", "35 phút", "40 phút"];

  // File Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processSelectedFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    try {
      setUploadedFile(file);
      setUploadedFileName(file.name);
      
      // Attempt to extract text content to enhance AI context if it is text-based
      const fileData = await readFileAsTextOrBase64(file);
      // We send extracted text, or a short indicator of attachment for files like pictures
      if (fileData.isText) {
        setUploadedFileContent(fileData.content.substring(0, 10000)); // Cap at 10k chars
      } else {
        setUploadedFileContent(`[Tệp đính kèm nhị phân dạng Base64 hoặc Ảnh: ${file.name}]`);
      }
    } catch (err) {
      console.error("Error reading file:", err);
      setUploadedFileName(file.name);
      setUploadedFileContent(`[Tệp đính kèm: ${file.name}]`);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadedFileName("");
    setUploadedFileContent("");
  };

  // Populate Form from Curated Template
  const loadTemplate = (template: typeof STEAM_TEMPLATES[0]) => {
    setTopic(template.topic);
    setName(template.name);
    setAge(template.age);
    setModel(template.model);
    setDuration(template.duration);
    setRequest("");
    setScreen("create");
  };

  // Copy Content to Clipboard
  const copyToClipboard = () => {
    const textToCopy = isEditingManually ? editableContent : selectedPlan?.content || "";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Plan as Markdown file
  const downloadPlan = () => {
    if (!selectedPlan) return;
    const text = isEditingManually ? editableContent : selectedPlan.content;
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${selectedPlan.name.replace(/\s+/g, "_")}_STEAM_${selectedPlan.model}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Native Browser Printing
  const printPlan = () => {
    if (!selectedPlan) return;

    // Get the rendered markdown content HTML from the DOM
    const markdownBody = document.querySelector('.markdown-body');
    const markdownHtml = markdownBody ? markdownBody.innerHTML : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Giáo án: ${selectedPlan.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;800&display=swap');
          
          body {
            font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
            line-height: 1.6;
            padding: 30px;
            margin: 0;
            background: #f8fafc;
          }
          
          .no-print-bar {
            background: #0f172a;
            color: white;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 16px;
            margin-bottom: 30px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          }
          
          .no-print-bar p {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
          }
          
          .no-print-bar button {
            background: #10b981;
            color: white;
            border: none;
            padding: 10px 20px;
            font-weight: 800;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
          }
          
          .no-print-bar button:hover {
            background: #059669;
            transform: translateY(-1px);
          }
          
          .print-paper {
            background: white;
            max-width: 850px;
            margin: 0 auto;
            padding: 50px;
            border-radius: 24px;
            box-shadow: 0 4px 30px rgba(0,0,0,0.03);
            border: 1px solid #e2e8f0;
          }
          
          .print-header {
            margin-bottom: 30px;
            border-bottom: 3px double #10b981;
            padding-bottom: 20px;
          }
          
          .model-badge {
            display: inline-block;
            padding: 4px 12px;
            font-size: 11px;
            font-weight: 800;
            border-radius: 9999px;
            text-transform: uppercase;
            background-color: #ecfdf5;
            color: #065f46;
            border: 1px solid #10b981;
            margin-bottom: 12px;
          }
          
          .model-edp {
            background-color: #f0f9ff;
            color: #0369a1;
            border: 1px solid #0ea5e9;
          }
          
          h1 {
            font-size: 28px;
            font-weight: 800;
            color: #065f46;
            margin: 0 0 15px 0;
            line-height: 1.3;
          }
          
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-bottom: 15px;
          }
          
          .meta-item {
            font-size: 13px;
          }
          
          .meta-label {
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.05em;
            margin-bottom: 2px;
          }
          
          .meta-value {
            font-weight: 700;
            color: #334155;
          }
          
          /* Markdown Content Styling */
          .markdown-body h1 {
            font-size: 20px;
            font-weight: 800;
            color: #065f46;
            margin-top: 25px;
            margin-bottom: 10px;
            page-break-after: avoid;
          }
          
          .markdown-body h2 {
            font-size: 16px;
            font-weight: 700;
            color: #047857;
            margin-top: 20px;
            margin-bottom: 8px;
            border-bottom: 2px solid #ecfdf5;
            padding-bottom: 4px;
            page-break-after: avoid;
          }
          
          .markdown-body h3 {
            font-size: 14px;
            font-weight: 700;
            color: #065f46;
            margin-top: 15px;
            margin-bottom: 6px;
            page-break-after: avoid;
          }
          
          .markdown-body p {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 13px;
            color: #334155;
            orphans: 3;
            widows: 3;
          }
          
          .markdown-body ul, .markdown-body ol {
            margin-top: 0;
            margin-bottom: 12px;
            padding-left: 20px;
          }
          
          .markdown-body li {
            margin-bottom: 4px;
            font-size: 13px;
            color: #334155;
            page-break-inside: avoid;
          }
          
          .markdown-body strong {
            font-weight: 700;
            color: #0f172a;
          }
          
          .markdown-body blockquote {
            border-left: 4px solid #10b981;
            background-color: #f0fdf4;
            padding: 10px 14px;
            font-style: italic;
            color: #065f46;
            border-radius: 6px;
            margin: 15px 0;
            page-break-inside: avoid;
          }
          
          .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .markdown-body th {
            background-color: #ecfdf5;
            color: #065f46;
            font-weight: 700;
            text-align: left;
            padding: 8px;
            border: 1px solid #d1fae5;
            font-size: 12px;
          }
          
          .markdown-body td {
            padding: 8px;
            border: 1px solid #e2e8f0;
            background-color: #ffffff;
            font-size: 12px;
          }
          
          .markdown-body tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          
          @media print {
            body {
              padding: 0 !important;
              background: white !important;
            }
            .no-print-bar {
              display: none !important;
            }
            .print-paper {
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              margin: 0 !important;
            }
            .markdown-body p, 
            .markdown-body li, 
            .markdown-body tr,
            blockquote {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <p>🖨️ <strong>Giao diện in ấn giáo án STEAM</strong> - Trình in sẽ tự động mở trong giây lát. Nếu không tự động mở, vui lòng nhấn nút bên phải.</p>
          <button onclick="window.print()">In Giáo Án</button>
        </div>
        <div class="print-paper">
          <div class="print-header">
            <div class="model-badge ${selectedPlan.model === "EDP" ? "model-edp" : ""}">
              Mô hình ${selectedPlan.model}
            </div>
            <h1>${selectedPlan.name}</h1>
            <div class="meta-grid">
              <div class="meta-item">
                <div class="meta-label">Chủ điểm</div>
                <div class="meta-value">${selectedPlan.topic}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Độ tuổi</div>
                <div class="meta-value">${selectedPlan.age}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Thời lượng</div>
                <div class="meta-value">${selectedPlan.duration}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Ngày lập</div>
                <div class="meta-value">${selectedPlan.createdAt}</div>
              </div>
              ${selectedPlan.fileName ? `
                <div class="meta-item" style="grid-column: span 2;">
                  <div class="meta-label">Học cụ đính kèm</div>
                  <div class="meta-value">📎 ${selectedPlan.fileName}</div>
                </div>
              ` : ''}
            </div>
          </div>
          <div class="markdown-body">
            ${markdownHtml}
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create direct user-triggered link opening behavior
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke the blob URL after a short duration to clean up memory
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  };

  // Call the server API endpoint to generate/edit the STEAM Plan
  const handleGeneratePlan = async () => {
    if (!topic.trim()) {
      alert("Vui lòng điền chủ đề hoạt động.");
      return;
    }
    if (!name.trim()) {
      alert("Vui lòng điền tên hoạt động/bài học.");
      return;
    }

    setIsGenerating(true);
    setLoadingStep(0);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          name,
          age,
          model,
          duration,
          request,
          fileName: uploadedFileName,
          fileContent: uploadedFileContent,
          useAi,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gặp lỗi trong quá trình tạo giáo án.");
      }

      const newPlan: ActivityPlan = {
        id: selectedPlan?.id || Date.now().toString(),
        name,
        topic,
        age,
        model,
        duration,
        content: data.content,
        fileName: uploadedFileName || undefined,
        fileContent: uploadedFileContent || undefined,
        createdAt: new Date().toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
      };

      setSelectedPlan(newPlan);
      setEditableContent(data.content);
      setIsEditingManually(false);
      setScreen("view_plan");
    } catch (error: any) {
      console.error(error);
      alert(`Lỗi tạo kế hoạch: ${error.message || error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Refine current plan using AI feedback loop
  const handleRefineWithAI = async () => {
    if (!selectedPlan || !refinementRequest.trim()) return;

    setIsRefining(true);
    setLoadingStep(0);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedPlan.topic,
          name: selectedPlan.name,
          age: selectedPlan.age,
          model: selectedPlan.model,
          duration: selectedPlan.duration,
          request: refinementRequest,
          currentPlanContent: isEditingManually ? editableContent : selectedPlan.content,
          fileName: selectedPlan.fileName,
          fileContent: selectedPlan.fileContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gặp lỗi trong quá trình chỉnh sửa giáo án.");
      }

      const updatedPlan: ActivityPlan = {
        ...selectedPlan,
        content: data.content,
        createdAt: new Date().toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }) + " (Đã cập nhật)",
      };

      setSelectedPlan(updatedPlan);
      setEditableContent(data.content);
      setRefinementRequest("");
      setIsEditingManually(false);
    } catch (error: any) {
      console.error(error);
      alert(`Lỗi tinh chỉnh kế hoạch: ${error.message || error}`);
    } finally {
      setIsRefining(false);
    }
  };

  // Save current plan to Local Storage library
  const handleSavePlan = () => {
    if (!selectedPlan) return;
    
    const planToSave: ActivityPlan = {
      ...selectedPlan,
      content: isEditingManually ? editableContent : selectedPlan.content,
    };

    savePlanToLocalStorage(planToSave);
    setSelectedPlan(planToSave);
    
    // Refresh local list
    const updatedList = getPlansFromLocalStorage();
    setSavedPlans(updatedList);
    
    alert("Đã lưu giáo án thành công vào thư viện của bạn!");
  };

  // Delete plan from library
  const handleDeletePlan = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!confirm("Bạn có chắc chắn muốn xóa giáo án này khỏi thư viện?")) return;

    deletePlanFromLocalStorage(id);
    const updatedList = getPlansFromLocalStorage();
    setSavedPlans(updatedList);

    if (selectedPlan?.id === id) {
      setSelectedPlan(null);
      setScreen("dashboard");
    }
  };

  // Load plan for editing inside creation form
  const handleEditPlanInForm = (plan: ActivityPlan) => {
    setSelectedPlan(plan);
    setTopic(plan.topic);
    setName(plan.name);
    setAge(plan.age);
    setModel(plan.model);
    setDuration(plan.duration);
    setUploadedFileName(plan.fileName || "");
    setUploadedFileContent(plan.fileContent || "");
    setRequest("");
    setScreen("create");
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] text-gray-800 font-sans selection:bg-green-200">
      
      {/* HEADER SECTION - Invisible during printing */}
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-md print:hidden">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setScreen("dashboard")}>
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
              <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">THIẾT KẾ HOẠT ĐỘNG STEAM</h1>
              <p className="text-xs md:text-sm font-semibold text-emerald-100 uppercase tracking-widest mt-0.5">Trợ lý sư phạm mầm non 5E & EDP</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setScreen("library")} 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl font-bold flex items-center gap-2 border border-white/10 text-sm"
            >
              <FolderOpen className="w-4 h-4 text-sky-200" />
              Thư viện ({savedPlans.length})
            </button>
            <button 
              onClick={() => {
                setTopic("");
                setName("");
                setAge("5-6 tuổi");
                setModel("5E");
                setDuration("30 phút");
                setRequest("");
                setUploadedFile(null);
                setUploadedFileName("");
                setUploadedFileContent("");
                setSelectedPlan(null);
                setScreen("create");
              }} 
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-teal-950 transition-all rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg border border-yellow-300 text-sm"
            >
              <Plus className="w-4 h-4 text-teal-950 stroke-[3]" />
              Tạo mới
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* ======================================================== */}
        {/* SCREEN 1: DASHBOARD                                      */}
        {/* ======================================================== */}
        {screen === "dashboard" && (
          <div className="space-y-8 print:hidden">
            {/* HERO BANNER */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-green-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl -z-10" />
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Mầm Non Kỷ Nguyên Số
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-900 leading-tight">
                  Tạo Giáo Án STEAM Chuẩn <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-sky-600 font-black">5E và EDP</span> Trong 1 Phút
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Hỗ trợ giáo viên mầm non xây dựng bài giảng khám phá khoa học (5E) hoặc chế tạo kĩ thuật (EDP) cực kỳ sinh động, bám sát tâm lý trẻ và tích hợp các phương pháp giáo dục hiện đại.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => {
                      setTopic("");
                      setName("");
                      setAge("5-6 tuổi");
                      setModel("5E");
                      setDuration("30 phút");
                      setRequest("");
                      setUploadedFile(null);
                      setUploadedFileName("");
                      setUploadedFileContent("");
                      setSelectedPlan(null);
                      setScreen("create");
                    }} 
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-2xl shadow-md shadow-emerald-500/20 hover:shadow-lg transition flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-200" />
                    Bắt đầu thiết kế bài học
                  </button>
                  <button 
                    onClick={() => setScreen("library")} 
                    className="px-6 py-3.5 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 font-bold rounded-2xl border border-sky-100 transition flex items-center gap-2"
                  >
                    <FolderOpen className="w-5 h-5 text-sky-600" />
                    Xem thư viện giáo án ({savedPlans.length})
                  </button>
                </div>
              </div>
              <div className="w-48 h-48 md:w-56 md:h-56 shrink-0 relative flex items-center justify-center bg-gradient-to-tr from-emerald-100 to-sky-100 rounded-3xl border border-emerald-50 shadow-inner">
                <span className="text-8xl">👩‍🏫</span>
                <span className="absolute -top-3 -right-3 text-4xl animate-bounce">🎈</span>
                <span className="absolute -bottom-2 -left-2 text-4xl">📚</span>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Đã thiết kế</h3>
                  <p className="text-2xl font-black text-emerald-900">{savedPlans.length} giáo án</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Mô hình ưa thích</h3>
                  <p className="text-lg font-bold text-gray-800">
                    5E: <span className="font-black text-emerald-600">{savedPlans.filter(p=>p.model==="5E").length}</span> | EDP: <span className="font-black text-sky-600">{savedPlans.filter(p=>p.model==="EDP").length}</span>
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Lứa tuổi học sinh</h3>
                  <p className="text-sm font-bold text-gray-800">
                    3-4t: {savedPlans.filter(p=>p.age==="3-4 tuổi").length} | 4-5t: {savedPlans.filter(p=>p.age==="4-5 tuổi").length} | 5-6t: {savedPlans.filter(p=>p.age==="5-6 tuổi").length}
                  </p>
                </div>
              </div>
            </div>

            {/* CURATED SUGGESTED TEMPLATES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-xl font-extrabold text-emerald-950">💡 Thử Ngay Các Chủ Đề Gợi Ý</h3>
                </div>
                <p className="text-xs text-gray-500 hidden sm:block">Nhấp để điền nhanh thông tin mẫu vào giáo án</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {STEAM_TEMPLATES.map((tpl, i) => (
                  <div 
                    key={i}
                    onClick={() => loadTemplate(tpl)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4 text-left relative overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl p-2 bg-emerald-50 rounded-xl group-hover:scale-110 transition">{tpl.icon}</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{tpl.age}</span>
                      </div>
                      <h4 className="font-extrabold text-emerald-950 group-hover:text-emerald-700 transition leading-tight">{tpl.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{tpl.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs font-semibold text-gray-500">
                      <span>Mô hình: <strong className="text-sky-600">{tpl.model}</strong></span>
                      <span>Thời lượng: <strong className="text-amber-600">{tpl.duration}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECENTLY DESIGNED */}
            {savedPlans.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FolderHeart className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-extrabold text-emerald-950">📂 Giáo án thiết kế gần đây</h3>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                  {savedPlans.slice(0, 3).map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlan(plan);
                        setEditableContent(plan.content);
                        setIsEditingManually(false);
                        setScreen("view_plan");
                      }}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-50 rounded-xl mt-1 shrink-0">
                          <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 line-clamp-1">{plan.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1 font-semibold">
                            <span>Chủ đề: <strong className="text-gray-700">{plan.topic}</strong></span>
                            <span>•</span>
                            <span>Độ tuổi: <strong className="text-emerald-700">{plan.age}</strong></span>
                            <span>•</span>
                            <span>Mô hình: <strong className={plan.model === "5E" ? "text-emerald-600" : "text-sky-600"}>{plan.model}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <span className="text-xs text-gray-400 font-semibold">{plan.createdAt}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 2: CREATE / EDIT FORM                             */}
        {/* ======================================================== */}
        {screen === "create" && (
          <div className="max-w-4xl mx-auto space-y-6 print:hidden">
            <button 
              onClick={() => setScreen("dashboard")} 
              className="px-4 py-2 text-sm text-gray-600 hover:text-emerald-700 font-bold flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại trang chủ
            </button>

            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-100 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-emerald-900">
                    {selectedPlan?.id ? "Sửa & Cải Tiến Giáo Án" : "Thông Tin Hoạt Động STEAM"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-semibold">Vui lòng điền thông tin để AI gợi ý hoặc chỉnh sửa giáo án tốt nhất</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full hidden sm:block">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              {/* FORM FIELDS */}
              <div className="space-y-5">
                
                {/* 1. Tên Bài Hoạt Động & Chủ Đề */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                      🌟 Tên bài hoạt động mầm non
                      <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Chế tạo kính hiển vi từ chai nhựa..." 
                      className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-semibold text-gray-800 shadow-sm text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                      📂 Chủ đề lớn (Chủ điểm)
                      <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ví dụ: Thế giới nước, Hiện tượng tự nhiên..." 
                      className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-semibold text-gray-800 shadow-sm text-sm"
                    />
                  </div>
                </div>

                {/* Quick Topic Chips */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nhập nhanh chủ điểm phổ biến:</span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TOPICS.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTopic(t.value);
                          if (!name) {
                            setName("Khám phá: " + t.label.split(" ").slice(1).join(" "));
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100/60 rounded-xl text-xs font-bold transition active:scale-95"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Lứa tuổi & Thời lượng */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Lứa tuổi */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-950">👼 Độ tuổi của trẻ</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["3-4 tuổi", "4-5 tuổi", "5-6 tuổi"] as AgeGroup[]).map((group) => {
                        const colors = group === "3-4 tuổi" 
                          ? "border-green-200 text-green-700 bg-green-50/40 hover:bg-green-50" 
                          : group === "4-5 tuổi" 
                          ? "border-sky-200 text-sky-700 bg-sky-50/40 hover:bg-sky-50" 
                          : "border-purple-200 text-purple-700 bg-purple-50/40 hover:bg-purple-50";
                        const activeColors = group === "3-4 tuổi" 
                          ? "bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/10" 
                          : group === "4-5 tuổi" 
                          ? "bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/10" 
                          : "bg-purple-500 text-white border-purple-500 shadow-sm shadow-purple-500/10";
                        return (
                          <button
                            key={group}
                            type="button"
                            onClick={() => setAge(group)}
                            className={`p-3 rounded-xl border-2 font-extrabold text-xs text-center transition ${age === group ? activeColors : colors}`}
                          >
                            {group}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Thời lượng */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-950">⏱️ Thời lượng hoạt động</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="Chọn hoặc nhập thời lượng" 
                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-semibold text-sm text-gray-800"
                        list="durations-list"
                      />
                      <datalist id="durations-list">
                        {QUICK_DURATIONS.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                    {/* Quick select buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_DURATIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDuration(d)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${duration === d ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Mô hình giáo dục - Large Visual Cards */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-950 block">🛠️ Chọn Mô hình Giáo dục STEAM</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card 5E */}
                    <div 
                      onClick={() => setModel("5E")}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${model === "5E" ? "bg-emerald-50/50 border-emerald-500 shadow-sm" : "bg-white border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800 text-xs font-black">5E</span>
                          <h4 className="font-extrabold text-sm text-emerald-950">Mô hình khám phá 5E</h4>
                        </div>
                        <input 
                          type="radio" 
                          name="model_select" 
                          checked={model === "5E"}
                          onChange={() => setModel("5E")}
                          className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                        Gồm 5 giai đoạn: Gắn kết (Engage) ➜ Khám phá (Explore) ➜ Giải thích (Explain) ➜ Áp dụng (Elaborate) ➜ Đánh giá (Evaluate).
                      </p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 py-0.5 px-2 rounded-full self-start">Thích hợp nhất cho Khám phá Khoa học</span>
                    </div>

                    {/* Card EDP */}
                    <div 
                      onClick={() => setModel("EDP")}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${model === "EDP" ? "bg-sky-50/50 border-sky-500 shadow-sm" : "bg-white border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-sky-100 rounded-lg text-sky-800 text-xs font-black">EDP</span>
                          <h4 className="font-extrabold text-sm text-sky-950">Quy trình Thiết kế Kỹ thuật</h4>
                        </div>
                        <input 
                          type="radio" 
                          name="model_select" 
                          checked={model === "EDP"}
                          onChange={() => setModel("EDP")}
                          className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                        Gồm 5 bước chế tạo: Xác định vấn đề (Ask) ➜ Tưởng tượng (Imagine) ➜ Lên kế hoạch (Plan) ➜ Chế tạo (Create) ➜ Cải tiến (Improve).
                      </p>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-100/50 py-0.5 px-2 rounded-full self-start">Thích hợp cho Chế tạo, Lắp ráp, Sáng tạo mẫu</span>
                    </div>
                  </div>
                </div>

                {/* 4. Yêu cầu chỉnh sửa đặc biệt */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    📝 Yêu cầu chỉnh sửa hoặc điều kiện đặc biệt
                    <span className="text-xs text-gray-400 font-semibold">(Không bắt buộc)</span>
                  </label>
                  <textarea 
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    placeholder="Ví dụ: Thêm trò chơi đóng vai chú thỏ; Cần đơn giản nguyên liệu dễ kiếm nhất; Tăng hoạt động giao tiếp nhóm cho trẻ nhút nhát..." 
                    className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-medium text-gray-800 h-24 text-sm resize-none"
                  />
                  {/* Quick request suggestions */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Thêm hoạt động trò chơi vận động",
                      "Đơn giản hóa vật liệu dễ tìm",
                      "Nhấn mạnh vào yếu tố Nghệ thuật (Art)",
                      "Tích hợp kể chuyện rùa và thỏ",
                      "Rút gọn bước giải thích ngắn lại"
                    ].map((reqStr) => (
                      <button
                        key={reqStr}
                        type="button"
                        onClick={() => setRequest(reqStr)}
                        className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-100"
                      >
                        + {reqStr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Drag and Drop File Attachment */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    📎 Tệp tài liệu đính kèm (Ảnh bản thiết kế, tài liệu học tập, v.v.)
                  </label>
                  
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed p-6 rounded-2xl text-center transition relative ${dragActive ? "border-emerald-400 bg-emerald-50/30" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
                  >
                    <input 
                      type="file" 
                      id="file-upload" 
                      multiple={false}
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    
                    {!uploadedFileName ? (
                      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="p-3 bg-white rounded-full shadow-sm text-emerald-600">
                          <CloudUpload className="w-8 h-8" />
                        </div>
                        <span className="text-emerald-700 font-bold text-sm">📎 Tải tài liệu đính kèm (PDF, Docx, Ảnh)</span>
                        <p className="text-xs text-gray-400">Kéo thả tệp hoặc bấm vào đây để tìm tệp của bạn</p>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{uploadedFileName}</p>
                            <p className="text-xs text-gray-400 font-semibold">Tệp đã sẵn sàng tải lên</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={removeUploadedFile}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Toggle Option */}
                <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 text-white rounded-xl">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950">Sử dụng AI thông minh gợi ý</h4>
                      <p className="text-xs text-gray-500 font-semibold">Kích hoạt Gemini AI để phân tích và biên soạn giáo án cực kỳ tối ưu.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useAi} 
                      onChange={(e) => setUseAi(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

              </div>

              {/* ACTIONS BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <button 
                  onClick={handleGeneratePlan}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-black text-sm shadow-md active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  {selectedPlan?.id ? "Cập Nhật Giáo Án (Gemini AI)" : "Tạo Kế Hoạch Hoạt Động"}
                </button>
                <button 
                  onClick={() => {
                    if (selectedPlan) {
                      setScreen("view_plan");
                    } else {
                      setScreen("dashboard");
                    }
                  }} 
                  className="py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-sm transition"
                >
                  Hủy bỏ
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: LIBRARY (SAVED PLANS)                          */}
        {/* ======================================================== */}
        {screen === "library" && (
          <div className="space-y-6 print:hidden">
            <button 
              onClick={() => setScreen("dashboard")} 
              className="px-4 py-2 text-sm text-gray-600 hover:text-emerald-700 font-bold flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại trang chủ
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-green-100 pb-4">
              <div>
                <h2 className="text-3xl font-black text-emerald-950 flex items-center gap-2">
                  📂 Thư Viện Hoạt Động Đã Lưu
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-1">Danh sách tất cả giáo án STEAM bạn đã biên soạn và lưu trữ</p>
              </div>
              <button
                onClick={() => {
                  setTopic("");
                  setName("");
                  setAge("5-6 tuổi");
                  setModel("5E");
                  setDuration("30 phút");
                  setRequest("");
                  setUploadedFile(null);
                  setUploadedFileName("");
                  setUploadedFileContent("");
                  setSelectedPlan(null);
                  setScreen("create");
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Tạo hoạt động mới
              </button>
            </div>

            {savedPlans.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-emerald-100 space-y-4">
                <span className="text-7xl">📭</span>
                <h3 className="text-xl font-bold text-emerald-950">Chưa có hoạt động nào được lưu</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Hãy thử tạo một hoạt động STEAM mới bằng Trợ lý AI và bấm nút &quot;Lưu hoạt động&quot; để lưu lại tại đây nhé.
                </p>
                <button
                  onClick={() => setScreen("create")}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition"
                >
                  Sáng tạo ngay giáo án đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedPlans.map((plan) => (
                  <div 
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setEditableContent(plan.content);
                      setIsEditingManually(false);
                      setScreen("view_plan");
                    }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-300 hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-4 relative"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${plan.model === "5E" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`}>
                          Mô hình {plan.model}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPlanInForm(plan);
                            }}
                            className="p-1 text-gray-400 hover:text-emerald-600 rounded-md hover:bg-gray-50 transition"
                            title="Sửa giáo án"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDeletePlan(plan.id, e)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-50 transition"
                            title="Xóa giáo án"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-extrabold text-lg text-emerald-950 line-clamp-1 leading-tight group-hover:text-emerald-700">
                        {plan.name}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-500 bg-gray-50 p-2.5 rounded-xl">
                        <p>Chủ đề: <strong className="text-gray-800 line-clamp-1">{plan.topic}</strong></p>
                        <p>Độ tuổi: <strong className="text-emerald-800">{plan.age}</strong></p>
                        <p>Thời lượng: <strong className="text-amber-800">{plan.duration}</strong></p>
                        {plan.fileName && <p className="col-span-2 text-sky-700 line-clamp-1">📎 Tệp: {plan.fileName}</p>}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                      <span>Ngày lưu: {plan.createdAt.split(" lúc")[0]}</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition">
                        Chi tiết <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 4: DETAILED PLAN VIEW / REFINEMENT                */}
        {/* ======================================================== */}
        {screen === "view_plan" && selectedPlan && (
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Control Bar - Invisible during printing */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
              <button 
                onClick={() => setScreen(savedPlans.some(p => p.id === selectedPlan.id) ? "library" : "dashboard")} 
                className="px-4 py-2 text-sm text-gray-600 hover:text-emerald-700 font-bold flex items-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại danh sách
              </button>

              <div className="flex items-center flex-wrap gap-2">
                <button 
                  onClick={handleSavePlan} 
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  Lưu hoạt động
                </button>
                <button 
                  onClick={copyToClipboard} 
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Đã sao chép!" : "Sao chép"}
                </button>
                <button 
                  onClick={printPlan} 
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Printer className="w-4 h-4 text-emerald-600" />
                  In giáo án
                </button>
                <button 
                  onClick={downloadPlan} 
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-4 h-4 text-sky-600" />
                  Tải .MD
                </button>
                <button 
                  onClick={() => handleDeletePlan(selectedPlan.id)} 
                  className="p-2.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-white border border-gray-100 hover:border-red-100 transition active:scale-95"
                  title="Xóa giáo án"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* MAIN TWO-COLUMN LAYOUT: DOCUMENT SCREEN & REFINER SIDEBAR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT: THE EDUCATION DOCUMENT PLATFORM */}
              <div className="lg:col-span-8 bg-white rounded-3xl shadow-lg border border-green-100 overflow-hidden print-section print:shadow-none print:border-none">
                
                {/* Header of the document sheet */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-6 sm:p-8 border-b border-emerald-50 relative">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${selectedPlan.model === "5E" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`}>
                        Mô hình {selectedPlan.model}
                      </span>
                      <span className="text-[11px] text-gray-400 font-semibold print:text-gray-600">Ngày lập: {selectedPlan.createdAt}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 leading-tight">
                      {selectedPlan.name}
                    </h2>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-emerald-50 shadow-inner">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Chủ điểm</p>
                        <p className="text-xs sm:text-sm font-extrabold text-gray-800 line-clamp-1">{selectedPlan.topic}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Độ tuổi</p>
                        <p className="text-xs sm:text-sm font-extrabold text-emerald-700">{selectedPlan.age}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Thời lượng</p>
                        <p className="text-xs sm:text-sm font-extrabold text-amber-700">{selectedPlan.duration}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Học cụ đính kèm</p>
                        <p className="text-xs sm:text-sm font-extrabold text-sky-700 line-clamp-1">
                          {selectedPlan.fileName ? `📎 ${selectedPlan.fileName}` : "Không có"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Body */}
                <div className="p-6 sm:p-8">
                  {/* Toggle inline edit vs Markdown view */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 print:hidden">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nội dung chi tiết giáo án</span>
                    <button
                      onClick={() => {
                        if (isEditingManually) {
                          setSelectedPlan({
                            ...selectedPlan,
                            content: editableContent
                          });
                        }
                        setIsEditingManually(!isEditingManually);
                      }}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition border border-gray-100"
                    >
                      {isEditingManually ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          Xem chế độ Markdown
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                          Sửa văn bản trực tiếp
                        </>
                      )}
                    </button>
                  </div>

                  {isEditingManually && (
                    <div className="space-y-4 print:hidden mb-4">
                      <p className="text-xs text-amber-600 font-semibold bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                        ⚠️ Bạn đang ở chế độ chỉnh sửa trực tiếp. Bạn có thể sửa từ ngữ, thay đổi các bước của giáo án, sau đó nhấn nút <strong>Lưu hoạt động</strong> để lưu lại.
                      </p>
                      <textarea
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                        className="w-full h-[500px] p-4 border border-gray-200 rounded-xl focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono text-sm leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Always render the Markdown viewer during printing, but hide it on screen if manually editing */}
                  <article className={`prose max-w-none text-gray-700 leading-relaxed text-sm md:text-base space-y-4 markdown-body ${isEditingManually ? "hidden print:block" : "block"}`}>
                    <Markdown>{isEditingManually ? editableContent : selectedPlan.content}</Markdown>
                  </article>
                </div>

              </div>

              {/* RIGHT: AI REFINER & EXPORT CONTROL - Sticky & Beautiful (Invisible during printing) */}
              <div className="lg:col-span-4 space-y-6 sticky top-6 print:hidden">
                
                {/* 1. INTERACTIVE CHAT AI REFINER */}
                <div className="bg-gradient-to-tr from-slate-900 to-teal-950 text-white p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />
                  
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <div className="p-2 bg-emerald-500 text-white rounded-xl">
                      <BrainCircuit className="w-5 h-5 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Trợ lý Tinh chỉnh AI</h3>
                      <p className="text-[10px] text-teal-200/70 font-semibold">Gợi ý sửa đổi cho giáo án này</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bạn muốn thêm hoạt động, đổi nguyên liệu hay sửa mục tiêu? Nhập yêu cầu dưới đây, AI sẽ lập tức hiệu chỉnh giáo án.
                  </p>

                  <div className="space-y-3">
                    <textarea
                      value={refinementRequest}
                      onChange={(e) => setRefinementRequest(e.target.value)}
                      placeholder="Ví dụ: Rút ngắn phần khám phá, thêm trò chơi vận động nhóm..."
                      className="w-full p-3 bg-white/5 border border-white/10 focus:border-emerald-400 rounded-xl focus:outline-none text-xs text-white placeholder-slate-400 h-20 resize-none leading-relaxed"
                    />

                    {/* Quick Suggestions for Refinement */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Làm ngắn gọn lại",
                        "Thêm hoạt động khởi động",
                        "Tập trung yếu tố Nghệ thuật",
                        "Thay vật liệu chai nhựa"
                      ].map((s) => (
                        <button
                          key={s}
                          onClick={() => setRefinementRequest(s)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-teal-200 rounded-lg transition"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleRefineWithAI}
                      disabled={!refinementRequest.trim() || isRefining}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 active:scale-[0.97] transition text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                    >
                      {isRefining ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang hiệu chỉnh...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-200" />
                          Cải tiến bằng AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. DIRECT FORM BACK-EDIT */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-extrabold text-sm text-gray-900">Muốn đổi thông tin chính?</h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    Nếu bạn muốn thay đổi tên bài hoạt động, độ tuổi học sinh hoặc đổi mô hình (5E sang EDP), hãy bấm chỉnh sửa lại biểu mẫu chính.
                  </p>
                  <button
                    onClick={() => handleEditPlanInForm(selectedPlan)}
                    className="w-full py-2.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 transition text-gray-700 rounded-xl font-bold text-xs border border-gray-100 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Chỉnh sửa biểu mẫu gốc
                  </button>
                </div>

                {/* 3. PEDAGOGICAL TIPS */}
                <div className="bg-amber-50/40 border border-amber-100 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800">
                    <Info className="w-4 h-4" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">Lời khuyên sư phạm</h4>
                  </div>
                  <p className="text-xs text-amber-900/80 leading-relaxed font-semibold">
                    {selectedPlan.model === "5E" 
                      ? "Mô hình 5E đặt nặng tính trải nghiệm tự do trước khi giải thích lý thuyết. Hãy cố gắng không giảng bài hoặc giải thích hiện tượng ở giai đoạn 'Khám phá'."
                      : "Mô hình EDP chú trọng làm việc nhóm để giải quyết vấn đề kỹ thuật thực tế. Trẻ cần có bản phác thảo ý tưởng vẽ trên giấy trước khi bắt đầu lấy nguyên vật liệu chế tạo."
                    }
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* GLOBAL LOADING OVERLAY                                   */}
      {/* ======================================================== */}
      <AnimatePresence>
        {(isGenerating || isRefining) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 print:hidden"
          >
            <div className="bg-white p-8 md:p-10 rounded-3xl max-w-lg w-full text-center space-y-6 shadow-2xl border border-emerald-100/50">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-4xl animate-pulse">👩‍🔬</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-emerald-950">
                  {isGenerating ? "AI Đang Soạn Giáo Án STEAM..." : "AI Đang Tinh Chỉnh Giáo Án..."}
                </h3>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Vui lòng chờ trong giây lát</p>
              </div>

              {/* Rotating Message Container */}
              <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl min-h-[64px] flex items-center justify-center">
                <p className="text-xs sm:text-sm font-bold text-emerald-800 leading-relaxed animate-pulse">
                  {LOADING_MESSAGES[loadingStep]}
                </p>
              </div>

              <div className="flex justify-center gap-1.5 text-xs text-gray-400 font-semibold">
                <BrainCircuit className="w-4 h-4 text-emerald-500" />
                <span>Trí tuệ nhân tạo Gemini 3.5 Flash</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINT STYLING - Standard white sheets styling embedded */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt !important;
          }
          .print\\:hidden, 
          header, 
          footer, 
          button, 
          textarea, 
          .no-print,
          .sticky,
          [class*="sticky"] {
            display: none !important;
          }
          .container, main, .grid {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .print-section {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            overflow: visible !important;
          }
          .print-section * {
            color: black !important;
            background: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          /* Beautiful heading layout for print */
          .print-section h1,
          .print-section h2,
          .print-section h3,
          .print-section h4 {
            color: black !important;
            font-weight: bold !important;
            page-break-after: avoid;
            margin-top: 1.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          .print-section h2 {
            font-size: 18pt !important;
            border-bottom: 1px solid #666 !important;
            padding-bottom: 4px !important;
          }
          .print-section h3 {
            font-size: 14pt !important;
          }
          .print-section p,
          .print-section li,
          .print-section td,
          .print-section th {
            font-size: 11pt !important;
            line-height: 1.6 !important;
          }
          .print-section ul,
          .print-section ol {
            padding-left: 20px !important;
            margin-bottom: 10px !important;
          }
          .print-section ul {
            list-style-type: disc !important;
          }
          .print-section ol {
            list-style-type: decimal !important;
          }
          .print-section table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 1.5rem !important;
            page-break-inside: avoid;
          }
          .print-section th,
          .print-section td {
            border: 1px solid #333 !important;
            padding: 8px !important;
            text-align: left !important;
          }
          .print-section th {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
          }
          .print-section article {
            page-break-inside: auto;
          }
          .print-section p,
          .print-section li,
          .print-section tr {
            page-break-inside: avoid;
          }
        }
      `}</style>

    </div>
  );
}
