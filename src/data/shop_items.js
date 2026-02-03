export const SHOP_CATEGORIES = [
    { id: 'wallpaper', name: '벽지', icon: '🎨' },
    { id: 'floor', name: '바닥', icon: '🧱' },
    { id: 'furniture', name: '가구', icon: '🛋️' },
    { id: 'electronic', name: '가전', icon: '📺' },
    { id: 'living', name: '생활/식물', icon: '🪴' },
    { id: 'hobby', name: '취미/장식', icon: '🎸' },
    { id: 'character', name: '캐릭터', icon: '👤' },
    { id: 'hair', name: '머리/모자', icon: '💇' },
    { id: 'accessory', name: '악세서리', icon: '👓' },
    { id: 'outfit', name: '의상', icon: '👕' }
];

export const SHOP_ITEMS = [
    // --- [기본 벽지/바닥] ---
    { id: 'wall_plain_white', category: 'wallpaper', name: '깨끗한 흰색 벽지', price: 0, spriteSheet: 'wallpapers_set', spriteX: 0, spriteY: 1, width: 64, height: 64, isDefault: true },
    { id: 'floor_plain_gray', category: 'floor', name: '심플 그레이 장판', price: 0, spriteSheet: 'floors_set', spriteX: 1, spriteY: 1, width: 64, height: 64, isDefault: true },

    // --- [벽지 (Wallpaper)] ---
    { id: 'wall_sky', category: 'wallpaper', name: '뭉게구름 하늘', price: 50, spriteSheet: 'wallpapers_set', spriteX: 0, spriteY: 0, width: 64, height: 64 },
    { id: 'wall_star', category: 'wallpaper', name: '반짝반짝 핑크별', price: 50, spriteSheet: 'wallpapers_set', spriteX: 1, spriteY: 0, width: 64, height: 64 },
    { id: 'wall_flower', category: 'wallpaper', name: '들꽃 민트', price: 50, spriteSheet: 'wallpapers_set', spriteX: 2, spriteY: 0, width: 64, height: 64 },
    { id: 'wall_brick', category: 'wallpaper', name: '빈티지 레드브릭', price: 80, spriteSheet: 'wallpapers_set', spriteX: 0, spriteY: 1, width: 64, height: 64 },
    { id: 'wall_wood', category: 'wallpaper', name: '포근한 로그월', price: 80, spriteSheet: 'wallpapers_set', spriteX: 1, spriteY: 1, width: 64, height: 64 },
    { id: 'wall_night', category: 'wallpaper', name: '도시의 야경', price: 120, spriteSheet: 'wallpapers_set', spriteX: 2, spriteY: 1, width: 64, height: 64 },

    // --- [바닥 (Floor/Rug)] ---
    { id: 'floor_wood', category: 'floor', name: '포근한 나무바닥', price: 50, spriteSheet: 'floors_set', spriteX: 0, spriteY: 0, width: 64, height: 64 },
    { id: 'floor_tile_pink', category: 'floor', name: '핑크 체크 타일', price: 60, spriteSheet: 'floors_set', spriteX: 1, spriteY: 0, width: 64, height: 64 },
    { id: 'floor_tile_blue', category: 'floor', name: '블루 모노 타일', price: 60, spriteSheet: 'floors_set', spriteX: 2, spriteY: 0, width: 64, height: 64 },
    { id: 'floor_grass', category: 'floor', name: '푸른 잔디밭', price: 80, spriteSheet: 'floors_set', spriteX: 0, spriteY: 1, width: 64, height: 64 },
    { id: 'floor_marble', category: 'floor', name: '럭셔리 대리석', price: 150, spriteSheet: 'floors_set', spriteX: 1, spriteY: 1, width: 64, height: 64 },
    { id: 'floor_carpet_red', category: 'floor', name: '로얄 레드 카펫', price: 200, spriteSheet: 'floors_set', spriteX: 2, spriteY: 1, width: 64, height: 64 },

    // --- [가구 (Furniture)] ---
    { id: 'bed_wood', category: 'furniture', name: '심플 나무 침대', price: 150, spriteSheet: 'furniture_beds', spriteX: 0, spriteY: 0, width: 80, height: 80 },
    { id: 'bed_princess', category: 'furniture', name: '공주님 캐노피 침대', price: 300, spriteSheet: 'furniture_beds', spriteX: 1, spriteY: 0, width: 80, height: 80 },
    { id: 'bed_modern_black', category: 'furniture', name: '모던 블랙 퀸베드', price: 400, spriteSheet: 'furniture_beds', spriteX: 0, spriteY: 1, width: 80, height: 80 },
    { id: 'sofa_leather_brown', category: 'furniture', name: '중후한 가죽 소파', price: 200, spriteSheet: 'furniture_chairs', spriteX: 0, spriteY: 0, width: 64, height: 64 },
    { id: 'sofa_fabric_pink', category: 'furniture', name: '러블리 핑크 소파', price: 180, spriteSheet: 'furniture_chairs', spriteX: 1, spriteY: 0, width: 64, height: 64 },
    { id: 'desk_study', category: 'furniture', name: '말씀 공부 책상', price: 120, spriteSheet: 'furniture_desks', spriteX: 0, spriteY: 0, width: 80, height: 80 },
    { id: 'desk_antique', category: 'furniture', name: '앤티크 서재 데스크', price: 280, spriteSheet: 'furniture_desks', spriteX: 1, spriteY: 0, width: 80, height: 80 },
    { id: 'table_marble_round', category: 'furniture', name: '대리석 원형 테이블', price: 150, icon: '⚪' },
    { id: 'bookshelf_tall', category: 'furniture', name: '천장까지 닿는 책장', price: 250, icon: '📚' },
    { id: 'wardrobe_white', category: 'furniture', name: '우아한 화이트 옷장', price: 350, icon: '👗' },

    // --- [가전 (Electronic)] ---
    { id: 'elec_pc_set', category: 'electronic', name: '풀옵션 게이밍 PC', price: 500, icon: '🖥️' },
    { id: 'elec_tv_huge', category: 'electronic', name: '65인치 벽걸이 TV', price: 450, icon: '📺' },
    { id: 'elec_home_theater', category: 'electronic', name: '웅장한 홈시어터', price: 600, icon: '🔊' },
    { id: 'elec_refrigerator', category: 'electronic', name: '실버 양문형 냉장고', price: 400, icon: '🧊' },
    { id: 'elec_ac_standing', category: 'electronic', name: '스탠드 에어컨', price: 300, icon: '❄️' },
    { id: 'elec_laptop', category: 'electronic', name: '슬림 메탈 노트북', price: 250, icon: '💻' },
    { id: 'elec_fan', category: 'electronic', name: '자연바람 선풍기', price: 80, icon: '🌀' },
    { id: 'elec_toaster', category: 'electronic', name: '갓 구운 토스터기', price: 40, icon: '🍞' },

    // --- [생활계/식물 (Living/Plant)] ---
    { id: 'plant_cactus', category: 'living', name: '귀요미 선인장', price: 40, icon: '🌵' },
    { id: 'plant_sunflower', category: 'living', name: '해바라기 화분', price: 60, icon: '🌻' },
    { id: 'plant_bonsai', category: 'living', name: '정성 담긴 분재', price: 120, icon: '🌳' },
    { id: 'living_fish_tank', category: 'living', name: '금붕어 어항', price: 180, icon: '🐠' },
    { id: 'living_dog_house', category: 'living', name: '강아지 집 & 밥그릇', price: 150, icon: '🐶' },
    { id: 'living_cat_tower', category: 'living', name: '높은 캣타워', price: 200, icon: '🐱' },
    { id: 'living_water_purifier', category: 'living', name: '시원한 정수기', price: 100, icon: '🚰' },

    // --- [취미/장식 (Hobby/Decor)] ---
    { id: 'hobby_piano_grand', category: 'hobby', name: '그랜드 피아노', price: 800, icon: '🎹' },
    { id: 'hobby_guitar_acoustic', category: 'hobby', name: '포크 기타', price: 150, icon: '🎸' },
    { id: 'hobby_easel', category: 'hobby', name: '화가 전용 이젤', price: 120, icon: '🎨' },
    { id: 'hobby_teddy_bear_xl', category: 'hobby', name: '대형 곰돌이 인형', price: 200, icon: '🧸' },
    { id: 'hobby_globe', category: 'hobby', name: '회전하는 지구본', price: 90, icon: '🌍' },
    { id: 'hobby_mirror_full', category: 'hobby', name: '전신 거울', price: 110, icon: '🪞' },
    { id: 'hobby_clock_wall', category: 'hobby', name: '클래식 벽시계', price: 50, icon: '⏰' },
    { id: 'hobby_holy_bible', category: 'hobby', name: '가죽 성경책(특별판)', price: 100, icon: '📖' },

    // --- [캐릭터 베이스 (Character)] ---
    { id: 'base_man', category: 'character', name: '청년 형제', price: 0, icon: '👨', isDefault: true },
    { id: 'base_woman', category: 'character', name: '청년 자매', price: 0, icon: '👩', isDefault: true },
    { id: 'base_boy', category: 'character', name: '남자 어린이', price: 0, icon: '👦', isDefault: true },
    { id: 'base_girl', category: 'character', name: '여자 어린이', price: 0, icon: '👧', isDefault: true },
    { id: 'base_senior_man', category: 'character', name: '장년 형제', price: 0, icon: '👴', isDefault: true },
    { id: 'base_senior_woman', category: 'character', name: '장년 자매', price: 0, icon: '👵', isDefault: true },

    // --- [머리/모자 (Hair/Hat)] ---
    { id: 'hair_short_black', category: 'hair', name: '단정한 흑발 숏컷', price: 30, icon: '👦' },
    { id: 'hair_long_brown', category: 'hair', name: '부드러운 갈색 긴머리', price: 40, icon: '👩' },
    { id: 'hair_curly_yellow', category: 'hair', name: '발랄한 금발 파마', price: 50, icon: '👱‍♀️' },
    { id: 'hair_cap_red', category: 'hair', name: '레드 베이스볼 캡', price: 60, icon: '🧢' },
    { id: 'hair_beanie_blue', category: 'hair', name: '포근한 블루 비니', price: 45, icon: '🧣' },
    { id: 'hair_tiara', category: 'hair', name: '반짝이는 티아라', price: 120, icon: '👑' },

    // --- [악세서리 (Accessory)] ---
    { id: 'acc_glasses_horn', category: 'accessory', name: '지적인 뿔테 안경', price: 40, icon: '👓' },
    { id: 'acc_sunglasses_dark', category: 'accessory', name: '시크한 선글라스', price: 80, icon: '😎' },
    { id: 'acc_ribbon_pink', category: 'accessory', name: '왕 리본 핀', price: 35, icon: '🎀' },
    { id: 'acc_mask_white', category: 'accessory', name: '황사 방지 마스크', price: 10, icon: '😷' },

    // --- [의상 (Outfit)] ---
    { id: 'outfit_hoodie_gray', category: 'outfit', name: '무채색 후드티', price: 100, icon: '🧥' },
    { id: 'outfit_suit_black', category: 'outfit', name: '정중한 블랙 수트', price: 250, icon: '👔' },
    { id: 'outfit_dress_yellow', category: 'outfit', name: '화사한 노란 원피스', price: 220, icon: '👗' },
    { id: 'outfit_jersey_blue', category: 'outfit', name: '활동적인 트레이닝복', price: 120, icon: '👕' },
    { id: 'outfit_hanbok', category: 'outfit', name: '설날 맞이 한복', price: 500, icon: '👘' }
];
