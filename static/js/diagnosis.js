
const modeToggleBtn = document.getElementById('modeToggleBtn');
modeToggleBtn.onclick = function () {
  const htmlTag = document.documentElement;
  const isDark = htmlTag.getAttribute('data-color-scheme') === 'dark';
  htmlTag.setAttribute('data-color-scheme', isDark ? 'light' : 'dark');
  this.textContent = isDark ? '🌙' : '☀';
};


const input = document.getElementById('symptoms-input');
const counter = document.getElementById('char-count');
const submitBtn = document.getElementById('submit-btn');
const refreshBtn = document.getElementById('refresh-btn');

input.addEventListener('input', () => {
  const length = input.value.length;
  counter.textContent = length;
  const isValid = input.value.trim().length >= 5;
  submitBtn.disabled = !isValid;
  submitBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  submitBtn.style.backgroundColor = isValid ? '#0056ff' : '#bcbcbc';
  submitBtn.style.color = isValid ? '#fff' : '#000';
});

refreshBtn.onclick = () => {
  input.value = '';
  counter.textContent = '0';
  submitBtn.disabled = true;
  submitBtn.style.cursor = 'not-allowed';
  submitBtn.style.backgroundColor = '#bcbcbc';
  submitBtn.style.color = '#000';

  const outputSection = document.getElementById('outputSection');
  outputSection.style.display = 'none';

  document.getElementById('diseaseName').textContent = 'Diagnosis Result';
  document.getElementById('diseaseDescription').textContent = '';
  document.getElementById('redFlags').textContent = '';
  document.getElementById('severity').textContent = '';
  document.getElementById('acuteness').textContent = '';
  document.getElementById('prevalence').textContent = '';
  document.getElementById('triageLevel').textContent = '';
  document.getElementById('hint').textContent = '';
};


lottie.loadAnimation({
  container: document.getElementById('doctor-animation'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: '/static/Doctor.json'
});


fetch('/static/doctor-info.json')
  .then(res => res.json())
  .then(data => {
    const doctor = Array.isArray(data) ? data[0] : data;
    document.getElementById('doctor-info').innerHTML = `
      <h3>${doctor.name || "Doctor Name"}</h3>
      <p style="font-weight:500; color:#334;">${doctor.specialty || ""}</p>
      ${doctor.clinic ? `<p style="color:#666;">${doctor.clinic}</p>` : ""}
    `;
  }).catch(() => {
    document.getElementById('doctor-info').innerHTML = "<em></em>";
  });


document.addEventListener("DOMContentLoaded", () => {
  const ageInput = document.getElementById("age");
  const genderInputs = document.getElementsByName("gender");

  submitBtn.addEventListener("click", async () => {
    const userSymptoms = input.value.trim();
    const age = ageInput.value || 30;
    let selectedGender = "male";
    for (const g of genderInputs) {
        if (g.checked) {
            selectedGender = g.value;
            break;
        }
    }

    try {
        const response = await fetch("/diagnose", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                symptoms: userSymptoms.split(" "),
                age: parseInt(age),
                sex: selectedGender
            })
        });

        const data = await response.json();

       
        console.log("Response Data:", data);

        if (response.ok && data.results && data.results.length > 0) {
            const result = data.results[0];

            
            document.getElementById('outputSection').style.display = 'block';
            document.getElementById('diseaseName').innerHTML = result.name
            ? `<span>${result.name}</span> <a href="https://www.google.com/search?q=${encodeURIComponent(result.name)}" target="_blank" style="font-size:14px;color:#007bff;">🔍 Learn More</a>`
            : 'Diagnosis Result';
            document.getElementById('diseaseDescription').textContent = result.description || 'No description available.';
            document.getElementById('redFlags').textContent = result.red_flags || 'No red flags available.';
            document.getElementById('severity').textContent = result.severity || 'No severity info available.';
            document.getElementById('acuteness').textContent = result.acuteness || 'No acuteness info available.';
            document.getElementById('prevalence').textContent = result.prevalence || 'No prevalence info available.';
            document.getElementById('triageLevel').textContent = result.triage_level || 'No triage level info available.';
            document.getElementById('hint').innerHTML = result.hint && result.hint !== 'No hint info available.'
            ? `${result.hint} <a href="https://www.google.com/search?q=${encodeURIComponent(result.hint)}" target="_blank" style="font-size:13px;color:#007bff;">🔍</a>`
            : 'No hint info available.';
        } else {
            console.error("No diagnosis found", data.error);
            alert(data.error || "No diagnosis found.");
        }
    } catch (err) {
        console.error("Error during diagnosis:", err);
        alert("Server error. Please try again later.");
    }
  });
});
