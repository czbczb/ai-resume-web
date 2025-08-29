import { GoogleGenAI } from "@google/genai";

// --- TypeScript Declarations ---
declare const google: any; // Declare Google Identity Services library

// --- Type Aliases and Interfaces ---
type ViewMode = 'initial' | 'loading' | 'image' | 'edit';
type PaymentMethod = 'wechat' | 'card' | null;
type Language = 'en' | 'zh';

interface PaymentRequest {
    amount: number;
    onConfirm: () => void;
}
interface User {
    name: string;
    avatar: string;
}
interface AppState {
  viewMode: ViewMode;
  isLoading: boolean;
  isDownloading: boolean;
  profession: string;
  generatedHtml: string;
  generatedImagePreviewUrl: string;
  freeGenerations: number;
  isLoggedIn: boolean;
  user: User | null;
  paymentRequest: PaymentRequest | null;
  paymentMethod: PaymentMethod;
  isLoginModalOpen: boolean;
  isPaying: boolean;
  paymentError: string | null;
  language: Language;
}
interface PendingAction {
    type: 'generate' | 'download';
    payload: {
        profession?: string;
        downloadType?: 'pdf' | 'word';
    };
}


// --- Constants ---
// IMPORTANT: Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; 
// IMPORTANT: Replace with your actual WeChat App ID and Redirect URI
const WECHAT_APP_ID = 'YOUR_WECHAT_APP_ID';
const WECHAT_REDIRECT_URI = encodeURIComponent('YOUR_WEBSITE_URL'); // e.g., https://yourapp.com

const FREE_GENERATION_LIMIT = 5;
const STORAGE_KEY = 'resumeArtisanGenerations';
const LANG_STORAGE_KEY = 'resumeArtisanLang';
const PENDING_ACTION_KEY = 'pendingResumeArtisanAction';
const GENERATION_COST = 2;
const PDF_COST = 5;
const WORD_COST = 10;

// --- I18n Translations ---
const translations = {
    en: {
        title: "AI Resume Artisan",
        logout: "Logout",
        loginToContinue: "Login to Continue",
        loginPrompt: "Please log in to generate your resume.",
        loginWithGoogle: "Login with Google",
        loginWithWeChat: "Login with WeChat",
        closeModal: "Close modal",
        verifyingPayment: "Verifying Payment...",
        processing: "Processing...",
        payNow: "Pay Now",
        iHavePaid: "I Have Paid",
        wechatPayTitle: "WeChat Pay (Simulated)",
        scanToPay: "Scan the QR code to pay",
        cancel: "Cancel",
        creditCardTitle: "Credit Card (Simulated)",
        enterCardDetails: "Enter your card details to pay",
        cardNumber: "Card Number",
        cardPlaceholder: "**** **** **** 1234",
        expiry: "Expiry (MM/YY)",
        expiryPlaceholder: "12/28",
        cvc: "CVC",
        cvcPlaceholder: "123",
        choosePaymentMethod: "Choose Payment Method",
        selectPayMethod: "Please select how you'd like to pay",
        wechatPay: "WeChat Pay",
        creditCard: "Credit Card",
        generating: "Generating...",
        generateResume: "Generate Resume",
        professionPlaceholder: "Enter a profession (e.g., Senior UX Designer)",
        pleaseLoginToGenerate: "Please log in to generate a resume.",
        freeGenerationsRemaining: "You have {count} free generations remaining.",
        freeGenerationsUsed: "Free generations used. Generation costs ¥{cost}.",
        editContent: "Edit Content",
        downloadPdf: "Download PDF",
        downloadWord: "Download Word",
        aiCrafting: "AI is crafting your resume...",
        resumePreviewAlt: "Preview of generated resume for {profession}",
        alertEnterProfession: "Please enter a profession.",
        alertGoogleLoginFailed: "Google login failed. Please try again.",
        alertGoogleSignInNotReady: "Google Sign-In is not ready. Please check your connection or try again in a moment.",
        alertGenerationError: "An error occurred while generating the resume. Please check the console for details.",
        alertDownloadErrorNotFound: "An error occurred: could not find the resume content to download.",
        alertDownloadError: "An error occurred while downloading the {type} file: {error}",
        paymentTimeoutError: "Payment check timed out. Please try again.",
        paymentWechatFailedError: "WeChat payment failed or was cancelled.",
        paymentStatusCheckError: "An error occurred while checking payment status.",
        paymentInvalidCardError: "Invalid card number format.",
        paymentInvalidExpiryError: "Invalid expiry date (MM/YY).",
        paymentInvalidCvcError: "Invalid CVC.",
        paymentCardDeclinedError: "Card declined. Please check your details.",
        paymentUnknownError: "An unknown error occurred.",
        paymentNetworkError: "A network error occurred.",
    },
    zh: {
        title: "AI 简历工匠",
        logout: "登出",
        loginToContinue: "请登录以继续",
        loginPrompt: "请登录以生成您的简历。",
        loginWithGoogle: "使用 Google 登录",
        loginWithWeChat: "使用微信登录",
        closeModal: "关闭弹窗",
        verifyingPayment: "验证支付中...",
        processing: "处理中...",
        payNow: "立即支付",
        iHavePaid: "我已支付",
        wechatPayTitle: "微信支付 (模拟)",
        scanToPay: "扫描二维码支付",
        cancel: "取消",
        creditCardTitle: "信用卡 (模拟)",
        enterCardDetails: "输入您的卡信息以支付",
        cardNumber: "卡号",
        cardPlaceholder: "**** **** **** 1234",
        expiry: "有效期 (MM/YY)",
        expiryPlaceholder: "12/28",
        cvc: "CVC",
        cvcPlaceholder: "123",
        choosePaymentMethod: "选择支付方式",
        selectPayMethod: "请选择您希望如何支付",
        wechatPay: "微信支付",
        creditCard: "信用卡",
        generating: "生成中...",
        generateResume: "生成简历",
        professionPlaceholder: "输入一个职业 (例如, 高级用户体验设计师)",
        pleaseLoginToGenerate: "请登录以生成简历。",
        freeGenerationsRemaining: "您还剩 {count} 次免费生成次数。",
        freeGenerationsUsed: "免费次数已用完。本次生成费用为 ¥{cost}。",
        editContent: "编辑内容",
        downloadPdf: "下载 PDF",
        downloadWord: "下载 Word",
        aiCrafting: "AI 正在精心制作您的简历...",
        resumePreviewAlt: "为 {profession} 生成的简历预览",
        alertEnterProfession: "请输入一个职业。",
        alertGoogleLoginFailed: "Google 登录失败，请重试。",
        alertGoogleSignInNotReady: "Google 登录尚未准备好。请检查您的网络连接或稍后重试。",
        alertGenerationError: "生成简历时发生错误。请查看控制台了解详情。",
        alertDownloadErrorNotFound: "发生错误：找不到要下载的简历内容。",
        alertDownloadError: "下载 {type} 文件时发生错误: {error}",
        paymentTimeoutError: "支付验证超时。请重试。",
        paymentWechatFailedError: "微信支付失败或已取消。",
        paymentStatusCheckError: "检查支付状态时发生错误。",
        paymentInvalidCardError: "无效的卡号格式。",
        paymentInvalidExpiryError: "无效的有效期 (MM/YY)。",
        paymentInvalidCvcError: "无效的 CVC。",
        paymentCardDeclinedError: "银行卡被拒绝。请检查您的信息。",
        paymentUnknownError: "发生未知错误。",
        paymentNetworkError: "发生网络错误。",
    }
}

// --- DOM Elements ---
const root = document.getElementById('root')!;

// --- State Management & Global Variables ---
let state: AppState = {
  viewMode: 'initial',
  isLoading: false,
  isDownloading: false,
  profession: '',
  generatedHtml: '',
  generatedImagePreviewUrl: '',
  freeGenerations: getFreeGenerationsFromStorage(),
  isLoggedIn: false,
  user: null,
  paymentRequest: null,
  paymentMethod: null,
  isLoginModalOpen: false,
  isPaying: false,
  paymentError: null,
  language: 'en',
};
let isGlobalClickListenerAdded = false;

function setState(newState: Partial<AppState>) {
  state = { ...state, ...newState };
  render();
}

// --- I18n Utility ---
function t(key: keyof typeof translations['en'], options?: Record<string, string | number>): string {
    let str = translations[state.language][key] || translations['en'][key];
    if (options) {
        Object.keys(options).forEach(optKey => {
            str = str.replace(`{${optKey}}`, String(options[optKey]));
        });
    }
    return str;
}


// --- Gemini API Initialization ---
let ai: GoogleGenAI;
try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
} catch(e) {
    console.error(e);
    root.innerHTML = `<div style="color: red; text-align: center; padding: 2rem; background: #fff; border-radius: 8px;">Failed to initialize Gemini API. Please ensure your API_KEY is set correctly.</div>`
}


// --- Core Logic ---

function getFreeGenerationsFromStorage(): number {
  const storedValue = localStorage.getItem(STORAGE_KEY);
  return storedValue ? parseInt(storedValue, 10) : FREE_GENERATION_LIMIT;
}

function updateStorageAndState(newValue: number) {
  localStorage.setItem(STORAGE_KEY, newValue.toString());
  setState({ freeGenerations: newValue });
}

async function executePendingAction() {
    const actionJSON = sessionStorage.getItem(PENDING_ACTION_KEY);
    if (!actionJSON) return;

    const action: PendingAction = JSON.parse(actionJSON);
    sessionStorage.removeItem(PENDING_ACTION_KEY);

    if (action.type === 'generate' && action.payload.profession) {
        await proceedWithGeneration(action.payload.profession);
    } else if (action.type === 'download' && action.payload.downloadType) {
        await proceedWithDownload(action.payload.downloadType);
    }
}

// --- Authentication Logic ---

function jwtDecode(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        return null;
    }
}

function handleCredentialResponse(response: any) {
    const payload = jwtDecode(response.credential);
    if (payload) {
        const user: User = { name: payload.name, avatar: payload.picture };
        setState({ isLoggedIn: true, user, isLoginModalOpen: false });
        executePendingAction();
    } else {
        console.error("Failed to decode Google credential.");
        alert(t('alertGoogleLoginFailed'));
        setState({ isLoginModalOpen: false });
    }
}

function handleGoogleLogin() {
    if (typeof google === 'undefined') {
        alert(t('alertGoogleSignInNotReady'));
        return;
    }
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });
    google.accounts.id.prompt();
}

function handleWeChatLogin() {
    // In a real app, you'd also generate and include a 'state' parameter for security.
    const wechatAuthUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT_APP_ID}&redirect_uri=${WECHAT_REDIRECT_URI}&response_type=code&scope=snsapi_login#wechat_redirect`;
    window.location.href = wechatAuthUrl;
}

function handleLoginCancel() {
    setState({ isLoginModalOpen: false });
    sessionStorage.removeItem(PENDING_ACTION_KEY);
}

function handleLogout() {
    setState({ isLoggedIn: false, user: null });
}

function handleLanguageChange(lang: Language) {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    setState({ language: lang });
}

// --- Payment Logic ---
let wechatPollInterval: number | null = null;
let wechatPollTimeout: number | null = null;
let pollAttempt = 0;

function requestPayment(amount: number, onConfirm: () => void) {
    setState({ 
        paymentRequest: { amount, onConfirm }, 
        paymentMethod: null,
        isPaying: false,
        paymentError: null
    });
}

// Simulates checking a backend endpoint for WeChat payment status
async function checkWeChatPaymentStatus(): Promise<{ status: 'SUCCESS' | 'PENDING' | 'FAILED' }> {
    return new Promise(resolve => {
        setTimeout(() => {
            pollAttempt++;
            // Succeed on the 3rd attempt
            if (pollAttempt >= 3) {
                resolve({ status: 'SUCCESS' });
            } 
            // 5% chance of early failure for demonstration
            else if (Math.random() < 0.05) {
                resolve({ status: 'FAILED' });
            }
            else {
                resolve({ status: 'PENDING' });
            }
        }, 1800); // Simulate network latency for the check
    });
}

// Stops any active polling timers
function stopWeChatPolling() {
    if (wechatPollInterval) clearInterval(wechatPollInterval);
    if (wechatPollTimeout) clearTimeout(wechatPollTimeout);
    wechatPollInterval = null;
    wechatPollTimeout = null;
    pollAttempt = 0;
}

// Starts the process of polling for WeChat payment confirmation
function startWeChatPaymentPolling() {
    stopWeChatPolling(); // Ensure no previous polls are running
    setState({ isPaying: true, paymentError: null });

    // Set a total timeout for the polling process (e.g., 30 seconds)
    wechatPollTimeout = window.setTimeout(() => {
        stopWeChatPolling();
        setState({ isPaying: false, paymentError: t('paymentTimeoutError') });
    }, 30000);

    const performPoll = async () => {
        try {
            const result = await checkWeChatPaymentStatus();
            if (result.status === 'SUCCESS') {
                stopWeChatPolling();
                if (state.paymentRequest) {
                    state.paymentRequest.onConfirm();
                }
                setState({ paymentRequest: null, paymentMethod: null, isPaying: false });
            } else if (result.status === 'FAILED') {
                stopWeChatPolling();
                setState({ isPaying: false, paymentError: t('paymentWechatFailedError') });
            }
            // If status is 'PENDING', do nothing and wait for the next interval.
        } catch (error) {
            stopWeChatPolling();
            setState({ isPaying: false, paymentError: t('paymentStatusCheckError') });
        }
    };

    // Start polling immediately, then every 2.5 seconds
    performPoll();
    wechatPollInterval = window.setInterval(performPoll, 2500);
}


// This function now takes card details and performs validation.
async function simulateCreditCardPayment(details: { cardNumber: string; expiry: string; cvc: string }): Promise<{ success: boolean; message?: string }> {
    return new Promise(resolve => {
        // Basic validation
        const cardNumber = details.cardNumber.replace(/\s/g, '');
        const expiry = details.expiry;
        const cvc = details.cvc;

        if (cardNumber.length < 15 || cardNumber.length > 16 || isNaN(parseInt(cardNumber))) {
             return resolve({ success: false, message: t('paymentInvalidCardError') });
        }
        if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) {
             return resolve({ success: false, message: t('paymentInvalidExpiryError') });
        }
        if (cvc.length < 3 || cvc.length > 4 || isNaN(parseInt(cvc))) {
             return resolve({ success: false, message: t('paymentInvalidCvcError') });
        }

        setTimeout(() => {
            // Simulate success if CVC is '123', otherwise fail.
            if (details.cvc === '123') {
                resolve({ success: true });
            } else {
                resolve({ success: false, message: t('paymentCardDeclinedError') });
            }
        }, 1500); // Simulate 1.5 seconds API call
    });
}


async function handlePaymentConfirm() {
    if (!state.paymentMethod) return;

    if (state.paymentMethod === 'wechat') {
        startWeChatPaymentPolling();
        return; // Polling function will handle state changes
    }
    
    // Logic for Credit Card
    setState({ isPaying: true, paymentError: null });

    const cardNumberInput = document.getElementById('card-number') as HTMLInputElement;
    const expiryInput = document.getElementById('card-expiry') as HTMLInputElement;
    const cvcInput = document.getElementById('card-cvc') as HTMLInputElement;

    try {
        const result = await simulateCreditCardPayment({
            cardNumber: cardNumberInput?.value || '',
            expiry: expiryInput?.value || '',
            cvc: cvcInput?.value || '',
        });

        if (result.success) {
            if (state.paymentRequest) {
                state.paymentRequest.onConfirm();
            }
            setState({ paymentRequest: null, paymentMethod: null });
        } else {
            setState({ paymentError: result.message || t('paymentUnknownError') });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('paymentNetworkError');
        setState({ paymentError: errorMessage });
    } finally {
        setState({ isPaying: false });
    }
}

function handlePaymentCancel() {
    stopWeChatPolling(); // Make sure to stop polling if user cancels
    setState({ paymentRequest: null, paymentMethod: null, isLoading: false, isDownloading: false });
}

function handleSelectPaymentMethod(method: 'wechat' | 'card') {
    setState({ paymentMethod: method, paymentError: null });
}

// --- Generation & Download ---
async function handleGenerateResume() {
  const input = document.getElementById('profession-input') as HTMLInputElement;
  const profession = input.value.trim();
  if (!profession) {
    alert(t('alertEnterProfession'));
    return;
  }
  
  const actionWithPayment = () => proceedWithGeneration(profession);
  
  const generationAction = () => {
      if (state.freeGenerations <= 0) {
          requestPayment(GENERATION_COST, actionWithPayment);
      } else {
          actionWithPayment();
      }
  };

  if (!state.isLoggedIn) {
      const pendingAction: PendingAction = { type: 'generate', payload: { profession } };
      sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(pendingAction));
      setState({ isLoginModalOpen: true });
      return;
  }

  generationAction();
}

async function proceedWithGeneration(profession: string) {
    setState({ isLoading: true, viewMode: 'loading', profession });

    try {
        const [htmlContent, bgImageUrl] = await Promise.all([
            generateResumeHtml(profession, state.language),
            generateBackgroundImage(profession, state.language)
        ]);
        
        const cleanedHtml = htmlContent.replace(/```html/g, '').replace(/```/g, '').trim();
        const finalHtml = cleanedHtml.replace('<!--BACKGROUND_IMAGE_URL-->', bgImageUrl);

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '800px';
        tempContainer.innerHTML = finalHtml;
        document.body.appendChild(tempContainer);
        
        const canvas = await (window as any).html2canvas(tempContainer.querySelector('#resume-container'));
        const imagePreviewUrl = canvas.toDataURL('image/png');

        document.body.removeChild(tempContainer);

        if (state.freeGenerations > 0) {
            updateStorageAndState(state.freeGenerations - 1);
        }

        setState({ 
            isLoading: false, 
            viewMode: 'image',
            generatedHtml: finalHtml,
            generatedImagePreviewUrl: imagePreviewUrl,
        });

    } catch (error) {
        console.error("Error generating resume:", error);
        alert(t('alertGenerationError'));
        setState({ isLoading: false, viewMode: 'initial' });
    }
}

async function generateResumeHtml(jobTitle: string, lang: Language): Promise<string> {
    const prompt = lang === 'zh' ? `作为世界级的专业简历设计师和文案撰稿人。
    你的任务是为一位有10年从业经验的**${jobTitle}**虚构候选人生成一份完整的、单页的HTML格式简历。
    简历必须：
    - **内容丰富**: 包含详细且可信的工作描述、带有可量化指标的成就、专业的个人简介、全面的技能部分、教育背景和相关项目。语气应高度专业。
    - **视觉吸引力**: 使用现代设计原则。布局应干净、易读且专业。
    - **自包含HTML与内联CSS**: 在单个父级 <div id="resume-container"> 中生成单一的HTML结构。所有样式必须是内联CSS (\`style="..."\`)。不要使用 \`<style>\` 标签或外部样式表。使用专业的调色板和网络安全的字体。
    - **结构化**: 使用语义化的HTML标签 (\`<section>\`, \`<h2>\`, \`<h3>\`, \`<p>\`, \`<ul>\`, \`<li>\`)。
    - **动态背景**: 主容器 \`<div id="resume-container">\` 的 \`style\` 属性必须设置为可使用背景图片。请使用 \`background-image: url('<!--BACKGROUND_IMAGE_URL-->'); background-size: cover; background-position: center; filter: brightness(0.8) saturate(1.2);\`。占位符 \`<!--BACKGROUND_IMAGE_URL-->\` 至关重要。
    不要包含 \`<html>\`, \`<head>\`, 或 \`<body>\` 标签。只输出 \`<div id="resume-container">\` 的内容。`
    : `Act as a world-class professional resume designer and copywriter.
    Your task is to generate a complete, one-page resume in HTML format for a fictional candidate with 10 years of experience as a **${jobTitle}**.
    The resume must be:
    - **Rich in Content:** Include detailed and plausible job descriptions, accomplishments with quantifiable metrics, a professional summary, a comprehensive skills section, education, and relevant projects. The tone should be highly professional.
    - **Visually Appealing:** Use modern design principles. The layout should be clean, readable, and professional.
    - **Self-Contained HTML with Inline CSS:** Generate a single HTML structure within a single parent <div id="resume-container">. All styling MUST be inline CSS (\`style="..."\`). Do not use \`<style>\` tags or external stylesheets. Use a professional color palette and fonts that are web-safe.
    - **Structured:** Use semantic HTML tags (\`<section>\`, \`<h2>\`, \`<h3>\`, \`<p>\`, \`<ul>\`, \`<li>\`).
    - **Dynamic Background:** The main container \`<div id="resume-container">\` MUST have its \`style\` attribute set up for a background image. Use \`background-image: url('<!--BACKGROUND_IMAGE_URL-->'); background-size: cover; background-position: center; filter: brightness(0.8) saturate(1.2);\`. The placeholder \`<!--BACKGROUND_IMAGE_URL-->\` is critical.
    Do not include \`<html>\`, \`<head>\`, or \`<body>\` tags. Only output the content for the \`<div id="resume-container">\`.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}

async function generateBackgroundImage(jobTitle: string, lang: Language): Promise<string> {
    const prompt = lang === 'zh'
        ? `为一位${jobTitle}的简历设计一张视觉震撼、抽象且专业的背景图片。设计应简约而优雅，使用微妙且精致的调色板。它不应分散注意力，但应增强文件的整体专业感。`
        : `A visually stunning, abstract, and professional background image for a resume of a ${jobTitle}. The design should be minimalist and elegant, using a subtle and sophisticated color palette. It should not be distracting but should enhance the overall professional feel of the document.`;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '9:16',
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
}

function handleEdit() {
    setState({ viewMode: 'edit' });
}

async function handleDownload(type: 'pdf' | 'word') {
    const cost = type === 'pdf' ? PDF_COST : WORD_COST;
    const actionWithPayment = () => proceedWithDownload(type);

    const downloadAction = () => {
        if (state.freeGenerations <= 0) {
            requestPayment(cost, actionWithPayment);
        } else {
            // For simplicity, we'll say downloads are always a paid feature
            // If you want free downloads, change this logic.
            requestPayment(cost, actionWithPayment);
        }
    };

    if (!state.isLoggedIn) {
        const pendingAction: PendingAction = { type: 'download', payload: { downloadType: type } };
        sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(pendingAction));
        setState({ isLoginModalOpen: true });
        return;
    }
    
    downloadAction();
}

async function proceedWithDownload(type: 'pdf' | 'word') {
    setState({ isDownloading: true });

    const editableDiv = document.getElementById('resume-editable-content');
    const sourceHtml = state.viewMode === 'edit' && editableDiv 
        ? editableDiv.innerHTML 
        : state.generatedHtml;

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '800px'; 
    tempContainer.innerHTML = sourceHtml;
    document.body.appendChild(tempContainer);

    const resumeElement = tempContainer.querySelector('#resume-container') as HTMLElement;

    if (!resumeElement) {
        console.error("Resume container '#resume-container' not found in the source HTML.");
        alert(t('alertDownloadErrorNotFound'));
        document.body.removeChild(tempContainer);
        setState({ isDownloading: false });
        return;
    }

    try {
        if (type === 'pdf') {
            const canvas = await (window as any).html2canvas(resumeElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = (window as any).jspdf;
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${state.profession.replace(/\s/g, '_')}_Resume.pdf`);
        } else if (type === 'word') {
            const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
                "xmlns:w='urn:schemas-microsoft-com:office:word' "+
                "xmlns='http://www.w3.org/TR/REC-html40'>"+
                "<head><meta charset='utf-8'><title>Resume</title></head><body>";
            const footer = "</body></html>";
            const sourceHTML = header + resumeElement.outerHTML + footer;
            const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
            (window as any).saveAs(blob, `${state.profession.replace(/\s/g, '_')}_Resume.doc`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error downloading ${type}:`, errorMessage);
        alert(t('alertDownloadError', { type: type.toUpperCase(), error: errorMessage }));
    } finally {
        document.body.removeChild(tempContainer);
        setState({ isDownloading: false });
    }
}


// --- UI Rendering ---

function App() {
    return `
    ${LoginModal()}
    ${PaymentModal()}
    <div class="top-bar">
        <h1>${t('title')}</h1>
        <div class="top-bar-controls">
            ${LanguageSwitcher()}
            ${state.isLoggedIn && state.user 
                ? UserProfile(state.user) 
                : ''
            }
        </div>
    </div>
    <main>
        ${MainContent()}
    </main>
    ${FloatingControls()}
    `;
}

function MainContent() {
    switch (state.viewMode) {
        case 'initial':
            return InputSection();
        case 'loading':
            return `<div class="loader"></div><p>${t('aiCrafting')}</p>`;
        case 'image':
        case 'edit':
            return ResultSection();
        default:
            return '';
    }
}

function LanguageSwitcher() {
    return `
    <div class="lang-switcher">
        <button id="lang-en-btn" class="lang-btn ${state.language === 'en' ? 'active' : ''}">EN</button>
        <button id="lang-zh-btn" class="lang-btn ${state.language === 'zh' ? 'active' : ''}">中文</button>
    </div>
    `;
}

function UserProfile(user: User) {
    return `
    <div class="user-profile" id="user-profile-trigger">
        <img src="${user.avatar}" alt="User avatar" class="user-avatar" />
        <span>${user.name}</span>
        <div class="dropdown-menu" id="user-dropdown">
            <button id="logout-btn" class="dropdown-item">${t('logout')}</button>
        </div>
    </div>
    `;
}

function LoginModal() {
    if (!state.isLoginModalOpen) return '';

    return `
    <div class="modal-overlay">
        <div class="modal-content">
            <button id="modal-close-btn" class="modal-close-btn" aria-label="${t('closeModal')}">&times;</button>
            <h2>${t('loginToContinue')}</h2>
            <p>${t('loginPrompt')}</p>
            <div class="login-modal-buttons">
                <button id="login-google-btn" class="btn btn-secondary btn-social">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                    <span>${t('loginWithGoogle')}</span>
                </button>
                <button id="login-wechat-btn" class="btn btn-secondary btn-social">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-brand-wechat"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M16.53 11.69c.18 .42 .27 .87 .27 1.31c0 2.21 -1.79 4 -4 4c-.44 0 -.87 -.07 -1.27 -.2c-.31 .23 -.65 .42 -1.01 .56c-.53 .2 -1.1 .31 -1.68 .31c-3.13 0 -5.84 -2.24 -5.84 -5.16c0 -2.92 2.7 -5.31 5.84 -5.31c3.02 0 5.61 2.22 5.82 5.02a4.032 4.032 0 0 1 -.02 .17z" fill="#7BB32E"></path><path d="M22 8.84c0 -2.66 -2.36 -4.84 -5 -4.84c-2.3 0 -4.31 1.57 -4.84 3.78c.45 -.15 .93 -.22 1.43 -.22c3.22 0 6.01 2.3 6.22 5.3c0 .02 0 .04 .01 .06c.14 .43 .21 .88 .21 1.34c0 2.4 -1.9 4.34 -4.29 4.34c-.5 0 -1 -.07 -1.45 -.2c-.38 .23 -.79 .42 -1.23 .56c-.53 .17 -1.08 .24 -1.64 .24c-2.4 0 -4.6 -1.33 -5.46 -3.31a5.85 5.85 0 0 1 1.44 .19c3.13 0 5.84 -2.24 5.84 -5.16c0 -.03 0 -.06 0 -.1c.01 -2.7 -2.03 -5.01 -4.71 -5.31c-.12 0 -.23 0 -.35 0c-2.64 0 -5 2.18 -5 4.84c0 .33 .04 .66 .11 .97c-.04 -.02 -.08 -.04 -.11 -.06c-.16 -.1 -.32 -.2 -.48 -.28c-.46 -.23 -.89 -.53 -1.28 -.88c-.01 0 -.02 -.01 -.03 -.01c-.1 -.08 -.19 -.17 -.28 -.26c-.34 -.34 -.63 -.73 -.86 -1.16c-.05 -.08 -.09 -.17 -.14 -.25c-.21 -.39 -.38 -.81 -.5 -1.25c-.06 -.22 -.12 -.45 -.16 -.68c-.08 -.41 -.13 -.84 -.13 -1.27c0 -3.22 2.83 -5.84 6.31 -5.84c3.48 0 6.31 2.62 6.31 5.84z" fill="#7BB32E"></path></svg>
                    <span>${t('loginWithWeChat')}</span>
                </button>
            </div>
        </div>
    </div>
    `;
}

function PaymentModal() {
    if (!state.paymentRequest) return '';

    const confirmButtonText = (() => {
        if (state.isPaying) {
            if (state.paymentMethod === 'wechat') return t('verifyingPayment');
            return t('processing');
        }
        if (state.paymentMethod === 'card') return t('payNow');
        if (state.paymentMethod === 'wechat') return t('iHavePaid');
        return '';
    })();


    const renderContent = () => {
        switch (state.paymentMethod) {
            case 'wechat':
                return `
                    <h2>${t('wechatPayTitle')}</h2>
                    <p>${t('scanToPay')} <strong>¥${state.paymentRequest!.amount}</strong></p>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=simulate-wechat-pay" alt="Simulated WeChat Pay QR Code" />
                    ${state.paymentError ? `<p class="modal-error">${state.paymentError}</p>` : ''}
                    <div class="modal-actions">
                        <button id="payment-confirm-btn" class="btn btn-primary" ${state.isPaying ? 'disabled' : ''}>${confirmButtonText}</button>
                        <button id="payment-cancel-btn" class="btn btn-secondary" ${state.isPaying ? 'disabled' : ''}>${t('cancel')}</button>
                    </div>
                `;
            case 'card':
                return `
                    <h2>${t('creditCardTitle')}</h2>
                    <p>${t('enterCardDetails')} <strong>¥${state.paymentRequest!.amount}</strong></p>
                    <div class="card-form">
                        <div class="card-form-group">
                            <label for="card-number">${t('cardNumber')}</label>
                            <input id="card-number" class="card-form-input" type="text" placeholder="${t('cardPlaceholder')}" />
                        </div>
                        <div class="card-form-group-row">
                            <div class="card-form-group">
                                <label for="card-expiry">${t('expiry')}</label>
                                <input id="card-expiry" class="card-form-input" type="text" placeholder="${t('expiryPlaceholder')}" />
                            </div>
                            <div class="card-form-group">
                                <label for="card-cvc">${t('cvc')}</label>
                                <input id="card-cvc" class="card-form-input" type="text" placeholder="${t('cvcPlaceholder')}" />
                            </div>
                        </div>
                    </div>
                     ${state.paymentError ? `<p class="modal-error">${state.paymentError}</p>` : ''}
                    <div class="modal-actions">
                        <button id="payment-confirm-btn" class="btn btn-primary" ${state.isPaying ? 'disabled' : ''}>${confirmButtonText}</button>
                        <button id="payment-cancel-btn" class="btn btn-secondary" ${state.isPaying ? 'disabled' : ''}>${t('cancel')}</button>
                    </div>
                `;
            default:
                return `
                    <h2>${t('choosePaymentMethod')}</h2>
                    <p>${t('selectPayMethod')} <strong>¥${state.paymentRequest!.amount}</strong></p>
                    <div class="payment-options">
                         <button id="pay-wechat-btn" class="btn btn-secondary payment-option-btn">${t('wechatPay')}</button>
                         <button id="pay-card-btn" class="btn btn-secondary payment-option-btn">${t('creditCard')}</button>
                    </div>
                    <div class="modal-actions">
                        <button id="payment-cancel-btn" class="btn btn-tertiary">${t('cancel')}</button>
                    </div>
                `;
        }
    };

    return `
    <div class="modal-overlay">
        <div class="modal-content" style="max-width: 400px;">
            ${renderContent()}
        </div>
    </div>
    `;
}


function InputSection() {
    const isDisabled = state.isLoading;
    const buttonText = state.isLoading ? t('generating') : t('generateResume');
    return `
        <div class="input-section">
            <div class="input-group">
                <input type="text" id="profession-input" placeholder="${t('professionPlaceholder')}" ${isDisabled ? 'disabled' : ''}/>
                <button id="generate-btn" class="btn btn-primary" ${isDisabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
             ${!state.isLoggedIn 
                ? `<p id="usage-counter">${t('pleaseLoginToGenerate')}</p>`
                : `<p id="usage-counter">
                    ${state.freeGenerations > 0 ? t('freeGenerationsRemaining', {count: state.freeGenerations}) : t('freeGenerationsUsed', { cost: GENERATION_COST })}
                   </p>`
            }
        </div>
    `;
}

function FloatingControls() {
    if (state.viewMode !== 'image' && state.viewMode !== 'edit') return '';
    
    return `
        <div class="floating-controls">
            ${state.viewMode === 'image' ? `<button id="edit-btn" class="btn btn-secondary">${t('editContent')}</button>` : ''}
            <button id="pdf-btn" class="btn btn-secondary" ${state.isDownloading ? 'disabled' : ''}>${t('downloadPdf')}</button>
            <button id="word-btn" class="btn btn-secondary" ${state.isDownloading ? 'disabled' : ''}>${t('downloadWord')}</button>
            ${state.isDownloading ? '<div class="loader" style="width:24px;height:24px;border-width:3px;"></div>' : ''}
        </div>
    `;
}

function ResultSection() {
    return `
        <div id="resume-content-wrapper" class="result-section">
        ${
            state.viewMode === 'image' ?
            `<img id="resume-image-preview" src="${state.generatedImagePreviewUrl}" alt="${t('resumePreviewAlt', { profession: state.profession })}" />` :
            `<div id="resume-editable-content" contenteditable="true">${state.generatedHtml}</div>`
        }
        </div>
    `;
}

function render() {
  if (!ai) return; // Don't render if AI client failed to init
  root.innerHTML = App();
  addEventListeners();
}

function addEventListeners() {
    document.getElementById('generate-btn')?.addEventListener('click', handleGenerateResume);
    document.getElementById('edit-btn')?.addEventListener('click', handleEdit);
    document.getElementById('pdf-btn')?.addEventListener('click', () => handleDownload('pdf'));
    document.getElementById('word-btn')?.addEventListener('click', () => handleDownload('word'));

    // Language switcher
    document.getElementById('lang-en-btn')?.addEventListener('click', () => handleLanguageChange('en'));
    document.getElementById('lang-zh-btn')?.addEventListener('click', () => handleLanguageChange('zh'));

    // Login Modal
    document.getElementById('login-google-btn')?.addEventListener('click', handleGoogleLogin);
    document.getElementById('login-wechat-btn')?.addEventListener('click', handleWeChatLogin);
    document.getElementById('modal-close-btn')?.addEventListener('click', handleLoginCancel);

    // Profile Dropdown
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    const userProfileTrigger = document.getElementById('user-profile-trigger');
    userProfileTrigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('user-dropdown')?.classList.toggle('open');
    });

    // Payment Modal
    document.getElementById('payment-confirm-btn')?.addEventListener('click', handlePaymentConfirm);
    document.getElementById('payment-cancel-btn')?.addEventListener('click', handlePaymentCancel);
    document.getElementById('pay-wechat-btn')?.addEventListener('click', () => handleSelectPaymentMethod('wechat'));
    document.getElementById('pay-card-btn')?.addEventListener('click', () => handleSelectPaymentMethod('card'));


    if (!isGlobalClickListenerAdded) {
        window.addEventListener('click', () => {
           document.getElementById('user-dropdown')?.classList.remove('open');
       });
       isGlobalClickListenerAdded = true;
   }
}

// --- App Initialization ---
async function initializeApp() {
    // Set language first
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
    if (savedLang) {
        state.language = savedLang;
    } else {
        state.language = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
    }


    const urlParams = new URLSearchParams(window.location.search);
    const wechatCode = urlParams.get('code');

    if (wechatCode) {
        // In a real app, send this code to your backend to get user info.
        // Here, we'll simulate it.
        console.log("Received WeChat auth code:", wechatCode);
        const user: User = { name: 'WeChat User', avatar: `https://api.dicebear.com/8.x/initials/svg?seed=WeChat%20User` };
        
        // Clean the URL of auth parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // We set state directly here to avoid a re-render flash.
        // The final render() call will catch everything.
        state.isLoggedIn = true;
        state.user = user;

        await executePendingAction();
    }
    
    render();
}

initializeApp();
