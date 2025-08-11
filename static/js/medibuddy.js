
document.getElementById('modeToggleBtn').onclick = function () {
  const htmlTag = document.documentElement;
  const isDark = htmlTag.getAttribute('data-color-scheme') === 'dark';
  htmlTag.setAttribute('data-color-scheme', isDark ? 'light' : 'dark');
  this.textContent = isDark ? '🌙' : '☀';
};

const input = document.getElementById("medicine-input");
const resultBox = document.getElementById("medicine-result");
const searchBtn = document.getElementById('searchMedicineBtn');


function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

let suggestionClicked = false;


searchBtn.onclick = () => {
  if (suggestionClicked) {
    suggestionClicked = false; 
    return;
  }
  const medName = input.value.trim();
  if (medName.length < 2) {
    resultBox.innerHTML = "<p>Please enter a valid medicine name.</p>";
    return;
  }
  searchBtn.disabled = true;
  fetchMedicineDetails(medName).finally(() => {
    searchBtn.disabled = false;
  });
};


const suggestionsContainer = document.createElement("div");
suggestionsContainer.id = "suggestions";
suggestionsContainer.style.position = "absolute";
suggestionsContainer.style.zIndex = "1000";
suggestionsContainer.style.background = "#fff";
suggestionsContainer.style.border = "1px solid #ccc";
suggestionsContainer.style.borderRadius = "6px";
suggestionsContainer.style.width = "100%";
suggestionsContainer.style.maxHeight = "180px";
suggestionsContainer.style.overflowY = "auto";
suggestionsContainer.style.display = "none";
input.parentNode.appendChild(suggestionsContainer);


input.addEventListener("input", () => {
  suggestionClicked = false;
});


input.addEventListener("input", debounce(async () => {
  const query = input.value.trim();
  if (query.length < 2) {
    suggestionsContainer.style.display = "none";
    resultBox.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`/search-medicine?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to fetch suggestions");
    const suggestions = await res.json();

    if (!suggestions.length) {
      suggestionsContainer.style.display = "none";
      return;
    }

    suggestionsContainer.innerHTML = "";
    suggestions.forEach(name => {
      const item = document.createElement("div");
      item.textContent = name;
      item.style.padding = "10px";
      item.style.cursor = "pointer";
      item.onmouseenter = () => item.style.background = "#f2f2f2";
      item.onmouseleave = () => item.style.background = "white";
      item.onclick = () => {
        input.value = name;
        suggestionsContainer.style.display = "none";
        suggestionClicked = true; 
        fetchMedicineDetails(name);
      };
      suggestionsContainer.appendChild(item);
    });

    suggestionsContainer.style.top = `${input.offsetTop + input.offsetHeight}px`;
    suggestionsContainer.style.left = `0px`;
    suggestionsContainer.style.display = "block";
  } catch {
    suggestionsContainer.style.display = "none";
  }
}, 300)); 


document.addEventListener("click", (e) => {
  if (!suggestionsContainer.contains(e.target) && e.target !== input) {
    suggestionsContainer.style.display = "none";
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    suggestionsContainer.style.display = "none";
  }
});


async function fetchMedicineDetails(name) {
  try {
    const res = await fetch(`/get-medicine-info?name=${encodeURIComponent(name)}`);
    if (!res.ok) {
      if (res.status === 404) {
        resultBox.innerHTML = `<p>Medicine "${name}" not found.</p>`;
      } else {
        resultBox.innerHTML = `<p>Error: Server returned status ${res.status}</p>`;
      }
      return;
    }

    const data = await res.json();
    console.log("Fetched medicine data:", data);

    const possiblePriceKeys = ["price(₹)", "price(â‚¹)", "price", "mrp", "Price"];
    let price = "N/A";
    for (const key of possiblePriceKeys) {
      if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
        price = data[key];
        break;
      }
    }

    resultBox.innerHTML = `
      <div class="description-box">
        <div class="description-icon">💊</div>
        <div class="description-note">
          <strong>Name:</strong> ${data.name || "N/A"}<br>
          <strong>Price:</strong> &#8377;${price}<br>
          <strong>Type:</strong> ${data.type || "N/A"}<br>
          <strong>Manufacturer:</strong> ${data.manufacturer_name || "N/A"}<br>
          <strong>Pack:</strong> ${data.pack_size_label || "N/A"}<br>
          <strong>Composition:</strong> ${data.short_composition1 || ''} ${data.short_composition2 || ''}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching medicine data:", error);
    resultBox.innerHTML = "<p>Failed to fetch medicine data. Please try again later.</p>";
  }
}