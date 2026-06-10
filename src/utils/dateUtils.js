// KST(한국 표준시) 기준 날짜 키 반환: 'YYYY-MM-DD'
export const kstDateKey = (date = new Date()) => {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date);
};

// KST 기준 오늘 날짜 문자열 (Date.toDateString() 호환용)
export const kstTodayDateString = () => {
    return new Date(kstDateKey()).toDateString();
};
