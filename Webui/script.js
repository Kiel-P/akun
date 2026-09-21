let allProxies = [];

// Merubah judul tab otomatis mengikuti nama domain hosting saat ini
document.title = window.location.hostname;

function toggleTheme() {
    const body = document.body;
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        document.getElementById('themeIcon').textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

function toggleClashSubOptions() {
    const format = document.getElementById('format').value;
    const clashContainer = document.getElementById('clashSubOptionsContainer');
    if (format === 'clash') {
        clashContainer.style.display = 'block';
    } else {
        clashContainer.style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').textContent = '☀️';
    }
});

function getFlagEmoji(isoCode) {
    if (!isoCode || isoCode.length !== 2) return "🏳️";
    return isoCode.toUpperCase().split('').map(char => 
        String.fromCodePoint(127397 + char.charCodeAt(0))
    ).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    fetch('/api/v1/proxies')
        .then(res => res.json())
        .then(data => {
            allProxies = data;
            const countries = [...new Set(data.map(p => p.country))].filter(c => c && c !== "UNKNOWN");
            const select = document.getElementById('countrySelect');
            
            countries.forEach(cc => {
                const opt = document.createElement('option');
                opt.value = cc;
                opt.textContent = `${getFlagEmoji(cc)}  ${cc}`;
                select.appendChild(opt);
            });
        }).catch(e => console.log("Gagal memuat data proxy"));
});

function filterProxiesByCountry() {
    const selectedCountry = document.getElementById('countrySelect').value;
    const container = document.getElementById('proxyCheckboxList');
    container.innerHTML = "";

    const filtered = allProxies.filter(p => p.country === selectedCountry);

    if (filtered.length === 0) {
        container.innerHTML = '<span style="color: var(--muted-text); font-size: 0.9rem;">Tidak ada proxy di negara ini.</span>';
        return;
    }

    filtered.forEach((p) => {
        const label = document.createElement('label');
        label.className = "proxy-item";
        label.innerHTML = `<input type="checkbox" name="proxyChk" value="${p.prxIP}:${p.prxPort}"> ${p.prxIP}:${p.prxPort} (${p.org})`;
        container.appendChild(label);
    });
}

function showTerminalAlert(mainText, subText = "") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let subTextHtml = subText ? `<p style="margin-top: 15px;">${subText}</p>` : '';
    
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-dot"></span>
            <span class="toast-title">SYSTEM_MSG</span>
        </div>
        <div class="toast-body">
            <p>${mainText}</p>
            ${subTextHtml}
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

function generateConfig() {
    const format = document.getElementById('format').value;
    let finalFormat = format;
    if (format === 'clash') {
        finalFormat = document.getElementById('clashSubFormat').value + '_clash';
    }

    const checkboxes = document.querySelectorAll('input[name="proxyChk"]:checked');
    
    if (checkboxes.length === 0) {
        showTerminalAlert("ERR: Pilih minimal satu proxy", "Silakan centang box terlebih dahulu.");
        return;
    }

    const selectedProxies = Array.from(checkboxes).map(cb => cb.value).join(',');
    
    document.getElementById('output443').value = "Memproses...";
    document.getElementById('output80').value = "Memproses...";

    fetch(`https://${window.location.host}/api/v1/sub?format=${finalFormat}&port=443&selected=${encodeURIComponent(selectedProxies)}`)
        .then(res => res.text())
        .then(data => { document.getElementById('output443').value = data; })
        .catch(() => { document.getElementById('output443').value = "Gagal memuat!"; });

    fetch(`https://${window.location.host}/api/v1/sub?format=${finalFormat}&port=80&selected=${encodeURIComponent(selectedProxies)}`)
        .then(res => res.text())
        .then(data => { document.getElementById('output80').value = data; })
        .catch(() => { document.getElementById('output80').value = "Gagal memuat!"; });
}

function copyText(elementId) {
    const box = document.getElementById(elementId);
    if(!box.value) return;
    box.select();
    box.setSelectionRange(0, 99999);
    
    const successMsg = "Config berhasil disalin!";
    const subMsg = "Silakan buka dan Tempel di aplikasi VPN Anda.";
    
    try {
        navigator.clipboard.writeText(box.value).then(() => {
            showTerminalAlert(successMsg, subMsg);
        }).catch(() => {
            document.execCommand("copy");
            showTerminalAlert(successMsg, subMsg);
        });
    } catch (err) {
        document.execCommand("copy");
        showTerminalAlert(successMsg, subMsg);
    }
}
