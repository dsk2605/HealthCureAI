document.addEventListener("DOMContentLoaded", () => {
    const sideMenu = document.getElementById("sideMenu");
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const modeToggleBtn = document.getElementById("modeToggleBtn");
    const root = document.documentElement;
    const logo = document.getElementById("logo");

    
    hamburgerBtn.addEventListener("click", () => {
        const isOpen = sideMenu.classList.contains("open");
        if (isOpen) {
            sideMenu.classList.remove("open");
            logo.classList.remove("slide-right");
            hamburgerBtn.classList.remove("active");
        } else {
            sideMenu.classList.add("open");
            logo.classList.add("slide-right");
            hamburgerBtn.classList.add("active");
        }
    });

    
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sideMenu.classList.contains("open")) {
            sideMenu.classList.remove("open");
            logo.classList.remove("slide-right");
            hamburgerBtn.classList.remove("active");
        }
    });

    
    sideMenu.addEventListener("click", (e) => {
        if (e.target === sideMenu) {
            sideMenu.classList.remove("open");
            logo.classList.remove("slide-right");
            hamburgerBtn.classList.remove("active");
        }
    });

   
    const savedScheme = localStorage.getItem("color-scheme");
    if (savedScheme) root.setAttribute("data-color-scheme", savedScheme);

    modeToggleBtn.addEventListener("click", () => {
        const current = root.getAttribute("data-color-scheme");
        const newScheme = current === "dark" ? "light" : "dark";
        root.setAttribute("data-color-scheme", newScheme);
        localStorage.setItem("color-scheme", newScheme);
    });

    
    const uploadBtn = document.getElementById("uploadReportMenu");
const uploadModal = document.getElementById("uploadModal");
const closeBtn = document.getElementById("closeUploadModal");
const scanReportBtn = document.getElementById("scanReportBtn");
const uploadPdfBtn = document.getElementById("uploadPdfBtn");
const reportInput = document.getElementById("reportInput");
const uploadForm = document.getElementById("uploadForm");
const uploadStatus = document.getElementById("uploadStatus");


uploadBtn.addEventListener("click", (e) => {
    e.preventDefault();
    uploadModal.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
    uploadModal.style.display = "none";
    reportInput.value = "";
    uploadForm.style.display = "none";
    uploadStatus.textContent = "";
});


uploadModal.addEventListener("click", (e) => {
    if (e.target === uploadModal) {
        uploadModal.style.display = "none";
        reportInput.value = "";
        uploadForm.style.display = "none";
        uploadStatus.textContent = "";
    }
});


scanReportBtn.addEventListener("click", () => {
    reportInput.accept = "image/*";
    reportInput.capture = "environment";
    uploadForm.style.display = "block";
});


uploadPdfBtn.addEventListener("click", () => {
    reportInput.accept = "application/pdf";
    reportInput.removeAttribute("capture");
    uploadForm.style.display = "block";
});


uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = reportInput.files[0];
    if (!file) {
        uploadStatus.textContent = "⚠️ Please select a file.";
        return;
    }

    const formData = new FormData();
    formData.append("report_file", file);
    uploadStatus.textContent = "Uploading...";

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (result.summary) {
            uploadStatus.textContent = "✅ Summary: " + result.summary;
        } else {
            uploadStatus.textContent = "❌ " + (result.error || "Upload failed.");
        }
    } catch (err) {
        console.error("Upload error:", err);
        uploadStatus.textContent = "Server error. Try again.";
    }
});



    
    const mainText = "HealthCure AI";
    const subText = "Your AI Medical Assistant";
    const mainLine = document.getElementById("mainLine");
    const subLine = document.getElementById("subLine");

    if (mainLine && subLine) {
        let mainIndex = 0;
        let subIndex = 0;

        function typeMain() {
            if (mainIndex < mainText.length) {
                mainLine.innerHTML += mainText.charAt(mainIndex);
                mainIndex++;
                setTimeout(typeMain, 75);
            } else {
                setTimeout(typeSub, 300);  
            }
        }

        function typeSub() {
            if (subIndex < subText.length) {
                subLine.innerHTML += subText.charAt(subIndex);
                subIndex++;
                setTimeout(typeSub, 50);
            } else {
                setTimeout(() => {
                    document.querySelector(".hero-section").classList.add("visible-text");
                }, 1000);  
            }
        }

        typeMain();
    }

    
    const medToggle = document.getElementById("medToggle");
    const submenuWrapper = document.getElementById("submenuWrapper");

    if (medToggle && submenuWrapper) {
        medToggle.addEventListener("click", () => {
            const parentItem = medToggle.closest(".has-submenu");
            parentItem.classList.toggle("open");
        });
    }

    const medibuddyBtn = document.getElementById("medibuddyMenu");
    const allopathyBtn = document.getElementById("allopathyMenu");
    const homeopathyBtn = document.getElementById("homeopathyMenu");


    if (allopathyBtn) {
        allopathyBtn.addEventListener("click", (e) => {
            e.preventDefault();
            alert("Allopathy Info clicked!");
        });
    }

    if (homeopathyBtn) {
        homeopathyBtn.addEventListener("click", (e) => {
            e.preventDefault();
            alert("Homeopathy Info clicked!");
        });
    }

   
    const voiceBtn = document.getElementById("voice-btn");
    const transcriptOutput = document.getElementById("transcript");
    const guideOptions = document.getElementById("guide-options");

    const welcomeText = "Hey there! How are you? Welcome to HealthCureAI. Feel free to ask me general medical questions or say I want a guide.";

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        speechSynthesis.speak(utterance);
    }

    
    voiceBtn.addEventListener("click", () => {
        const selectedLang = document.getElementById("language-select").value;
        let greeting = "";

        switch (selectedLang) {
            case "en":
                greeting = "Hey there! How are you? Welcome to HealthCure AI. Feel free to ask general medical questions or say I want a guide.";
                break;
            case "hi":
                greeting = "नमस्ते! आप कैसे हैं? HealthCure AI में आपका स्वागत है। आप मुझसे सामान्य चिकित्सा प्रश्न पूछ सकते हैं या कह सकते हैं 'मुझे गाइड चाहिए'।";
                break;
            case "gu":
                greeting = "નમસ્તે! તમે કેમ છો? HealthCure AI માં આપનું સ્વાગત છે. તમે સામાન્ય તબીબી પ્રશ્નો પૂછો અથવા કહો 'મને માર્ગદર્શન જોઈએ છે'.";
                break;
            case "mr":
                greeting = "नमस्कार! तुम्ही कसे आहात? HealthCure AI मध्ये तुमचं स्वागत आहे. तुम्ही सामान्य वैद्यकीय प्रश्न विचारू शकता किंवा म्हणू शकता 'मला मार्गदर्शक हवा आहे'.";
                break;
            default:
                greeting = "Please select a language.";
        }

        transcriptOutput.textContent = greeting;
        speakText(greeting, selectedLang);
    });

    
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";  
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn.addEventListener("click", () => {
        recognition.start();
        recognition.onresult = (event) => {
            const userInput = event.results[0][0].transcript.toLowerCase();
            if (userInput.includes("guide")) {
                transcriptOutput.textContent = "Sure! Here are your guide options:";
                guideOptions.style.display = "flex";
            }
        };

        recognition.onerror = (event) => {
            console.log("Speech recognition error", event.error);
        };
    });

    
    function speakText(text, langCode) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = synth.getVoices();
        let targetLang = {
            en: "en", hi: "hi", gu: "gu", mr: "mr"
        }[langCode];

        
        const voice = voices.find(v => v.lang.toLowerCase().includes(targetLang));
        if (voice) utterance.voice = voice;

        synth.cancel(); 
        synth.speak(utterance);
    }
});
function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}
function navigateTo(menuId) {
  const menuItem = document.getElementById(menuId);
  if (menuItem && menuItem.tagName === "A") {
    
    window.location.href = menuItem.href;
  }
}