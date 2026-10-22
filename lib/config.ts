/** 사이트 전역 설정. 단위 이름이나 시작 자금을 바꾸려면 여기만 고치면 됩니다. */
export const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "대구군위초등학교";
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "새싹 펀딩";
export const UNIT = process.env.NEXT_PUBLIC_UNIT || "새싹";
export const UNIT_EMOJI = process.env.NEXT_PUBLIC_UNIT_EMOJI || "🌱";
export const STARTING_BALANCE = Number(process.env.STARTING_BALANCE || 5);
export const ADMIN_ID = process.env.ADMIN_ID || "admin";
/** 상품 하나에 올릴 수 있는 사진 수 */
export const MAX_IMAGES = 8;
/** 심는 이유 글자 수 */
export const REASON_MIN = 5;
export const REASON_MAX = 300;
