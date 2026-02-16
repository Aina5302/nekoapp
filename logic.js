// --- LOGIC STYLE (Bản chuẩn hóa nhiệt độ) ---
function generateRecommendation(weather, preferences) {
    const { temp, condition } = weather;
    const { coldSensitivity, heatSensitivity, skirtLength, outdoorDuration } = preferences;
    
    // --- BƯỚC QUAN TRỌNG: TỰ ĐỘNG PHÂN LOẠI TYPE THEO NHIỆT ĐỘ ---
    let type = '';
    if (temp < 5) type = 'very_cold';
    else if (temp < 12) type = 'cold';
    else if (temp < 18) type = 'cool';
    else if (temp < 25) type = 'warm';
    else type = 'hot';

    const isShortSkirt = (skirtLength === 'mini' || skirtLength === 'knee');
    let recommendations = [`【${temp}°C / ${condition}】` + "\n--- 足元と小物の提案 ---"];

    // --- TRƯỜNG HỢP 1: SIÊU LẠNH (< 5°C) HOẶC (LẠNH & CHỊU LẠNH KÉM) ---
    if (type === 'very_cold' || (type === 'cold' && coldSensitivity === 'low')) {
        recommendations.push("❄️ 【防寒最優先: 極暖スタイル】");       
        if (isShortSkirt) {
            recommendations.push("🧦 Legwear: 1200Dの裏起毛タイツ。生足に見える『フェイクタイツ』が最強！");
            if (outdoorDuration === 'long') recommendations.push("👢 Footwear: ロングブーツ ＋ つま先用カイロを忘れずに。");
        } else {
            recommendations.push("🧦 Legwear: 厚手の裏起毛レギンス ＋ 厚手の靴下。");
        }
        recommendations.push("🧣 Accessories: 厚手のマフラー、手袋、耳当て。");
        if (outdoorDuration === 'long') recommendations.push("🔥 貼るカイロを腰と足裏に装備して！");
    } 
    // --- TRƯỜNG HỢP 2: LẠNH VỪA (5°C - 12°C) ---
    else if (type === 'cold' || (type === 'cool' && coldSensitivity === 'low')) {
        recommendations.push("🧥 【冷え対策: 標準防寒】"); 
        if (isShortSkirt) {
            recommendations.push("🧦 Legwear: 80〜110デニールのタイツ。");
            if (coldSensitivity === 'high') {
                recommendations.push("🦵 Nama check: 生足は絶対にNG！凍えちゃうよ！");
            }
        }    
        recommendations.push("🧣 Accessories: ニットマフラー。手袋はレザー製がおすすめ.");
    } 
    // --- TRƯỜNG HỢP 3: MÁT MẺ / ẤM ÁP (12°C - 25°C) ---
    else if (type === 'cool' || type === 'warm') {
        recommendations.push("🌤️ 【快適重視：季節の変わり目スタイル】");
        if (isShortSkirt) {
            if (coldSensitivity === 'low') {
                recommendations.push("🧦 レッグウェア（寒がりの方向け）：40〜60デニールのタイツで、ほんのり暖かさをキープ。");
                recommendations.push("🧣 小物：ストールを持ち歩くと、急な冷え込みにも安心です。");
            } 
            else if (heatSensitivity === 'high') {
                recommendations.push("🦵 生足モード（暑がりの方向け）：思い切って生足で開放的に！");
                recommendations.push("🧦 タイツを履くなら、20デニールのシアータイツで涼しげに.");
            } 
            else {
                if (outdoorDuration === 'long') {
                    recommendations.push("🧦 レッグウェア：夕方の冷え込みに備えて、20〜30デニールのタイツがおすすめ。");
                } else {
                    recommendations.push("🦵 生足モード：お散歩なら生足でも気持ちいい気温です！");
                }
            }
        }
        recommendations.push("🧥 その他：脱ぎ着しやすいカーディガンがあると便利です。");
    } 
    // --- TRƯỜNG HỢP 4: NÓNG (> 25°C) ---
    else {
        recommendations.push("🥵 【猛暑対策: 解放感スタイル】");
        if (isShortSkirt) {
            recommendations.push("🦵 Legwear: 断然『生足(Nama)』！ストッキングは暑苦しいだけだよ。");
            recommendations.push("👡 Footwear: 通気性の良いサンダルやスポーツサンダル.");
        }
        recommendations.push("🕶️ Accessories: UVカットサングラス、完全遮光の日傘.");
        if (heatSensitivity === 'high' || outdoorDuration === 'long') {
            recommendations.push("❄️ クールリング（ネッククーラー）で首元を冷やしてね。");
        }
    }

    // --- TRƯỜNG HỢP ĐẶC BIỆT: MƯA/TUYẾT/NẮNG (Hỗ trợ cả Kanji và Romaji) ---
    const cond = condition.toLowerCase();
    if (cond.includes('雨') || cond.includes('rain')) {
        recommendations.push("☔ Rain: 傘とレインブーツ推奨忘れず。生足なら濡れてもすぐ拭けるよ！");
    } else if (cond.includes('雪') || cond.includes('snow')) {
        recommendations.push("❄️ Snow: 滑り止め靴 ＋ 防水スプレーを靴に吹きかけて！");
    } else if (cond.includes('晴') || cond.includes('clear')) {
        if (heatSensitivity === 'high' || type === 'hot') {
            recommendations.push("☀️ Sun: 生足が黒焦げにならないよう、最強の日焼け止めを！😜");
        }
    }
// --- 5. LOGIC QUAN TÂM SỨC KHỎE (Gộp chung để nhân đôi sự ấm áp) ---
    const health = preferences.healthStatus;
    let healthAdvice = "";

    if (health === 'period') {
        healthAdvice = "\n\n✨ 【あの...】\n🩸 今日は女の子の日だね。お腹と腰を絶対に冷やさないで！もこもこの靴下を履いて、温かい飲み物を持って無理せず過ごそうね。🩹";
    } else if (health === 'tired') {
        healthAdvice = "\n\n✨ 【あの...】\n☁️ ちょっとお疲れ気味かな？今日は締め付けの少ないゆったりした服を選んで、自分を甘やかしてあげてね。🍬";
    } else if (health === 'cold_suspect') {
        healthAdvice = "\n\n✨ 【あの...】\n🧣 風邪気味かも？首元を温めるのが一番だよ！マフラーをしっかり巻いて、帰ったらすぐにお風呂で温まってね。约束だよ！💊";
    }

    // Gộp tất cả lại thành một sớ tư vấn hoàn chỉnh
    return recommendations.join('\n') + healthAdvice;
}