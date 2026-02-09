let scene, camera, renderer, characterGroup, controls, currentGLBModel = null;

// --- 0. CẤU HÌNH THEME THEO MODEL ---
const modelThemes = {
    'model1': { bg: '#fcd5d7', text: '#b54a55' }, // Mèo Trắng - Hồng
    'model2': { bg: '#dbeafe', text: '#1e40af' }, // Mèo Mướp - Xanh biển
    'model3': { bg: '#fff5e6', text: '#d97706' }, // Bunny - Xám ngầu
    'model4': { bg: '#fff0f3', text: '#ff4d6d' } // Kitten - Vàng ấm
};

function applyThemeByModel(modelKey) {
    const root = document.documentElement;
    const theme = modelThemes[modelKey] || modelThemes['model1'];
    root.style.setProperty('--app-bg-color', theme.bg);
    root.style.setProperty('--app-text-color', theme.text);
}

// --- 1. KHỞI TẠO 3D ---
function init3D() {
    const container = document.getElementById('canvasContainer');
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1, 3); 

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // CHỈ DÙNG 1 ĐÈN AMBIENT NÀY THÔI SẾP
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    ambientLight.name = "myAmbientLight"; 
    scene.add(ambientLight);

    // ĐÈN CHIẾU HƯỚNG (Tạo bóng đổ cho Boss mèo có khối)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(2, 5, 3); 
    scene.add(dirLight);

    characterGroup = new THREE.Group();
    scene.add(characterGroup);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    animate();
}

// --- 2. TẢI MODEL ---
function loadCatModel(modelName) {
    const config = MODEL_CONFIGS[modelName] || MODEL_CONFIGS['model1'];
    const loader = new THREE.GLTFLoader();
    const modelPath = `media/${config.fileName}`;

    // TÌM VÀ CHỈNH SÁNG TRƯỚC
    const ambient = scene.getObjectByName("myAmbientLight");
    if (ambient) {
        ambient.intensity = config.lightIntensity; // Lúc này config.lightIntensity sẽ có tác dụng!
    }

    loader.load(modelPath, (gltf) => {
        if (currentGLBModel) {
            characterGroup.remove(currentGLBModel);
            // Giải phóng bộ nhớ cho Boss cũ
            currentGLBModel.traverse(node => {
                if (node.isMesh) {
                    node.geometry.dispose();
                    node.material.dispose();
                }
            });
        }

        const model = gltf.scene;
        model.scale.set(config.scale, config.scale, config.scale);
        model.position.set(-0.2, config.positionY, 0);
        model.rotation.y = config.rotationY;
        model.userData.initialY = config.positionY;

        currentGLBModel = model;
        characterGroup.add(currentGLBModel);
    });
}
// --- 3. XỬ LÝ CHECK THỜI TIẾT ---
async function handleCheck() {
    const cityKey = document.getElementById('city').value;
    
    // FIX TẠI ĐÂY: Đảm bảo lấy đúng ID từ HTML (healthStatus thay vì activityNotes)
    const prefs = {
        coldSensitivity: document.getElementById('coldSensitivity').value,
        heatSensitivity: document.getElementById('heatSensitivity').value,
        skirtLength: document.getElementById('skirtLength').value,
        outdoorDuration: document.getElementById('outdoorDuration').value,
        healthStatus: document.getElementById('healthStatus') ? document.getElementById('healthStatus').value : 'good',
    };

    try {
        const coords = cityCoordinates[cityKey];
        // Sếp nhớ kiểm tra xem API_KEY đã được khai báo ở đầu file hoặc file config chưa nhé!
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric&lang=ja`);
        const data = await res.json();
        
        const temp = Math.round(data.main.temp);
        const condition = data.weather[0].description;
        
        document.getElementById('weatherLocation').textContent = data.name;
        document.getElementById('weatherTemperature').textContent = `${temp}°C`;
        document.getElementById('weatherCondition').textContent = condition;

        updateWeatherEffect(condition, temp);
        
        // Gọi hàm từ logic.js
        const advice = generateRecommendation({ temp, condition }, prefs);
        document.getElementById('recommendationText').innerText = advice;

    } catch (e) {
        console.error("Lỗi xử lý:", e);
        alert("Có lỗi xảy ra rồi sếp ơi! Check console xem sao.");
    }
}

// --- 4. HIỆU ỨNG THỜI TIẾT ---
function updateWeatherEffect(condition, temp) {
    const overlay = document.getElementById('weatherOverlay');
    if (!overlay) return;
    overlay.innerHTML = ''; 

    const desc = condition.toLowerCase();
    
    // 1. Kích hoạt hiệu ứng thời tiết (Mây, Mưa, Tuyết, Gió)
    if (desc.includes('雨') || desc.includes('rain')) {
        createParticles('rain-streak animate-rain', 60);
        if (desc.includes('heavy') || desc.includes('thunder')) triggerLightning();
    }
    if (desc.includes('雪') || desc.includes('snow')) { 
        createParticles('absolute animate-fall', 15, '🤍');
        createParticles('absolute animate-fall', 20, '❄️');
    }
    if (desc.includes('雲') || desc.includes('曇') || desc.includes('cloud')) {
        createParticles('absolute animate-cloud', 8, '☁️');
    }
    if (desc.includes('風') || desc.includes('wind')) {
        createParticles('absolute animate-leaf', 15, '🍃');
    }

    // 2. Logic Mặt trời (Độc lập hoàn toàn)
    // Hiện mặt trời khi: Trời quang (Clear) HOẶC (Trời ấm > 16°C VÀ không phải đang mưa/tuyết)
    const isClear = desc.includes('晴') || desc.includes('clear');
    const isRainOrSnow = desc.includes('雨') || desc.includes('rain') || desc.includes('雪') || desc.includes('snow');

    if (isClear || (temp > 16 && !isRainOrSnow)) {
        const sun = document.createElement('div');
        sun.className = 'sun-element';
        overlay.appendChild(sun);
        console.log("☀️");
    }
}
// CHỈ GIỮ LẠI MỘT HÀM CREATEPARTICLES XỊN NHẤT
function createParticles(className, count, emoji = '') {
    const overlay = document.getElementById('weatherOverlay');
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = className;
        p.style.left = Math.random() * 100 + '%';

        if (className.includes('rain')) {
            p.style.top = (Math.random() * 500 - 100) + 'px';
            p.style.animationDuration = (Math.random() * 0.3 + 0.5) + 's';
        } else if (className.includes('leaf')) {
            p.innerText = emoji;
            p.style.top = (Math.random() * 100) + '%';
            p.style.fontSize = (Math.random() * 20 + 30) + 'px';
            p.style.animationDuration = (Math.random() * 3 + 2) + 's';
        } else if (className.includes('cloud')) {
            p.innerText = emoji;
            p.style.top = (Math.random() * 40 + 5) + '%';
            p.style.fontSize = (Math.random() * 40 + 70) + 'px';
            p.style.animationDuration = (Math.random() * 10 + 15) + 's';
            p.style.opacity = '0.6';
        } else {
            p.innerText = emoji;
            p.style.top = (Math.random() * 500 - 100) + 'px';
            p.style.fontSize = (Math.random() * 10 + 20) + 'px';
            p.style.animationDuration = (Math.random() * 2 + 3) + 's';
        }
        overlay.appendChild(p);
    }
}

function triggerLightning() {
    const container = document.getElementById('canvasContainer');
    const flash = document.createElement('div');
    flash.className = 'lightning-flash animate-lightning';
    container.appendChild(flash); 
    setTimeout(() => flash.remove(), 350); 
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
    if (currentGLBModel) {
        const baseY = currentGLBModel.userData.initialY;
        currentGLBModel.position.y = baseY + Math.sin(Date.now() * 0.002) * 0.1;
    }
}

// --- 5. KHỞI CHẠY ---
window.onload = () => { 
    init3D();
    const modelDropdown = document.getElementById('modelSelect');
    const checkButton = document.getElementById('checkButton');
    const healthSelect = document.getElementById('healthStatus');

    if (modelDropdown) {
        loadCatModel(modelDropdown.value);
        applyThemeByModel(modelDropdown.value);
        modelDropdown.addEventListener('change', (e) => {
            loadCatModel(e.target.value);
            applyThemeByModel(e.target.value);
        });
    }

    // Tặng thêm sếp hiệu ứng đổi màu app khi chọn "Ngày đèn đỏ" nè
    if (healthSelect) {
        healthSelect.addEventListener('change', (e) => {
            if (e.target.value === 'period') {
                document.documentElement.style.setProperty('--app-bg-color', '#fff0f3');
            } else {
                applyThemeByModel(modelDropdown.value);
            }
        });
    }

    if (checkButton) checkButton.addEventListener('click', handleCheck);
};