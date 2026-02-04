import React from 'react';
import { Assets } from '../../assets/miniroom';

/**
 * 전용 아이템 렌더링 컴포넌트
 * spriteSheet 이름과 인덱스를 기반으로 해당 아이템만 크롭해서 보여줍니다.
 */
const SpriteItem = ({
    item,
    size = 64,
    className = "",
    style = {},
    scale = 1
}) => {
    if (!item || !item.spriteSheet) return null;

    const imageUrl = Assets[item.spriteSheet] || '';

    const spriteWidth = item.width || 64;
    const spriteHeight = item.height || 64;

    // spriteX, spriteY는 0부터 시작하는 인덱스라고 가정
    const backgroundPositionX = -(item.spriteX * spriteWidth);
    const backgroundPositionY = -(item.spriteY * spriteHeight);

    // 시트의 전체 컬럼 수 계산
    let cols = 8;
    if (item.spriteSheet.includes('set')) {
        cols = item.spriteSheet.includes('wallpaper') || item.spriteSheet.includes('floor') ? 3 : 2;
    } else if (item.spriteSheet.includes('furniture')) {
        // 새로 생성한 4x2 가구 시트들
        cols = 4;
    }
    const sheetWidth = cols * spriteWidth;

    const containerStyle = {
        width: `${spriteWidth * scale}px`,
        height: `${spriteHeight * scale}px`,
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: `${backgroundPositionX * scale}px ${backgroundPositionY * scale}px`,
        backgroundSize: `${sheetWidth * scale}px auto`,
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'transparent',
        imageRendering: 'pixelated', // 픽셀아트 느낌 살리기
        ...style
    };




    return (
        <div className={`sprite-item ${className}`} style={containerStyle} title={item.name} />
    );
};

export default SpriteItem;
