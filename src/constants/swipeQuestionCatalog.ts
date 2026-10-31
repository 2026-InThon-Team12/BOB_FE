// Offline fallback data aligned with BOB_BE swipe-v2. AI adaptation runs on the server.
export const SWIPE_QUESTION_VERSION = "swipe-v2" as const;

export const SWIPE_ANSWER_SPEC = {
  "type": "CHOICE",
  "interaction": "SWIPE",
  "polarity": "PURCHASE_SUPPORT",
  "options": [
    {
      "code": "YES",
      "label": "예",
      "direction": "right"
    },
    {
      "code": "UNSURE",
      "label": "잘 모르겠어요",
      "direction": "up"
    },
    {
      "code": "NO",
      "label": "아니요",
      "direction": "left"
    }
  ]
} as const;

export const swipePreCatalog = [
  {
    "code": "SW_PRE_NEED",
    "wording": "최근 {item}이(가) 없어서 불편했나요?"
  },
  {
    "code": "SW_PRE_ALTERNATIVE",
    "wording": "가진 {alternative}만으로는 부족해 {item}이(가) 필요한가요?"
  },
  {
    "code": "SW_PRE_TODAY",
    "wording": "오늘 {item}을(를) {occasion} 일이 있었나요?"
  },
  {
    "code": "SW_PRE_CASH",
    "wording": "{item} 값만큼 현금으로 받아도 이걸 살 건가요?"
  },
  {
    "code": "SW_PRE_WEEK_AGO",
    "wording": "일주일 전에도 {item}을(를) 갖고 싶었나요?"
  },
  {
    "code": "SW_PRE_WEEK_LATER",
    "wording": "일주일 뒤에도 {item}을(를) 갖고 싶을까요?"
  },
  {
    "code": "SW_PRE_REPLACE",
    "wording": "{item}을(를) 산 뒤 잃어버리면 다시 살 건가요?"
  },
  {
    "code": "SW_PRE_PROMO",
    "wording": "할인 없이도 {item}을(를) 살 건가요?"
  },
  {
    "code": "SW_PRE_CUSTOM",
    "wording": "{item}을(를) {check}"
  }
] as const;

export const swipePostCatalog = [
  {
    "code": "SW_POST_FIT",
    "wording": "{item}이(가) 원했던 조건에 맞나요?"
  },
  {
    "code": "SW_POST_READY",
    "wording": "{item}을(를) {check}"
  },
  {
    "code": "SW_POST_NEED",
    "wording": "돌아봐도 {item}이(가) 필요한 구매였나요?"
  },
  {
    "code": "SW_POST_ALTERNATIVE",
    "wording": "가진 {alternative}만으로는 부족해 {item}을(를) 샀나요?"
  },
  {
    "code": "SW_POST_TIME",
    "wording": "{item}을(를) {use_plan}"
  },
  {
    "code": "SW_POST_UPKEEP",
    "wording": "관리하는 수고를 감수해도 {item}이(가) 필요한가요?"
  },
  {
    "code": "SW_POST_PRICE",
    "wording": "같은 금액을 다시 내도 {item}을(를) 살 건가요?"
  },
  {
    "code": "SW_POST_PRIORITY",
    "wording": "다른 지출보다 {item} 구매가 우선이었나요?"
  }
] as const;

export const swipeProfiles = {
  "yoga": {
    "activity": "요가나 스트레칭",
    "barrier": "바닥의 미끄러움이나 관절에 가해지는 압박",
    "benefit": "안정적인 자세와 충분한 쿠션을 확보하기",
    "setup": "매트를 펼칠 공간과 운동 시간을 확보할",
    "upkeep": "운동 후 매트를 닦고 보관하는",
    "check": "펼칠 공간이 있나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "keyboard": {
    "activity": "타이핑 작업",
    "barrier": "타이핑할 때의 손목 부담이나 입력 불편",
    "benefit": "편하게 타이핑하기",
    "setup": "기기 연결 방식과 책상 공간을 확인할",
    "upkeep": "키보드를 청소하고 관리하는",
    "check": "쓸 기기의 연결 방식을 확인했나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "shoes": {
    "activity": "걷기나 운동",
    "barrier": "걷거나 운동할 때의 발 불편",
    "benefit": "발에 맞게 편안히 걷기",
    "setup": "발에 맞는 크기와 착용할 일정을 확인할",
    "upkeep": "신발을 세탁하고 보관하는",
    "check": "신을 일정이 있나요?",
    "alternative": "신발",
    "occasion": "신고 나갈"
  },
  "film": {
    "activity": "태블릿 필기나 화면 보기",
    "barrier": "화면 반사나 필기감의 불편",
    "benefit": "편안한 화면 보기와 필기감을 확보하기",
    "setup": "기기 모델과 필름의 호환성을 확인할",
    "upkeep": "필름을 부착하고 교체하는",
    "check": "붙일 화면 크기를 확인했나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "whitening": {
    "activity": "치아 관리",
    "barrier": "현재 치아 관리 방식으로 충족되지 않는 관리 목적",
    "benefit": "원하는 치아 관리 목적을 충족하기",
    "setup": "제품의 사용 조건과 주의사항을 확인할",
    "upkeep": "제품 사용 조건을 확인하며 관리하는",
    "check": "사용할 때 주의할 점을 확인했나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "remover": {
    "activity": "메이크업 지우기",
    "barrier": "현재 세정 방식으로 메이크업을 지우기 어려운",
    "benefit": "메이크업을 충분히 지우기",
    "setup": "내 피부와 화장 방식에 맞는 제품인지 확인할",
    "upkeep": "사용한 패드를 처리하고 소모품을 다시 구입하는",
    "check": "써도 되는 피부인지 확인했나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "clothes": {
    "activity": "평소 외출이나 예정된 일정",
    "barrier": "기존 옷으로 필요한 차림을 갖추기 어려운",
    "benefit": "필요한 차림을 갖추기",
    "setup": "옷장 속 옷과의 조합 및 사이즈를 확인할",
    "upkeep": "옷을 세탁하고 보관하는",
    "check": "기존 옷과 맞춰 입을 수 있나요?",
    "alternative": "옷",
    "occasion": "입고 나갈"
  },
  "furniture": {
    "activity": "생활 공간 활용",
    "barrier": "현재 공간의 수납이나 배치 불편",
    "benefit": "필요한 공간을 확보하기",
    "setup": "설치할 공간의 치수와 동선을 확인할",
    "upkeep": "가구를 청소하고 자리를 유지하는",
    "check": "놓을 공간이 있나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "appliance": {
    "activity": "집안일",
    "barrier": "현재 집안일에 드는 시간과 수고",
    "benefit": "집안일의 시간과 수고를 줄이기",
    "setup": "설치 공간과 사용 조건을 확인할",
    "upkeep": "제품을 청소하고 유지비를 부담하는",
    "check": "설치할 공간이 있나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "digital": {
    "activity": "기기를 이용한 작업",
    "barrier": "현재 기기의 기능이나 호환성 부족",
    "benefit": "필요한 작업을 수행하기",
    "setup": "기존 기기와의 호환성을 확인할",
    "upkeep": "기기 설정과 유지 관리를 하는",
    "check": "쓸 기기의 연결 방식을 확인했나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "beauty": {
    "activity": "평소 피부 관리나 메이크업",
    "barrier": "현재 제품으로 원하는 관리를 하기 어려운",
    "benefit": "원하는 관리 목적을 충족하기",
    "setup": "피부에 맞는 성분과 사용 조건을 확인할",
    "upkeep": "사용기한과 보관 조건을 지키는",
    "check": "써도 되는 피부인지 확인했나요?",
    "alternative": "제품",
    "occasion": "쓸"
  },
  "food": {
    "activity": "예정된 식사나 간식",
    "barrier": "집에 있는 식품만으로 식사 계획을 채우기 어려운",
    "benefit": "계획한 식사를 준비하기",
    "setup": "먹을 양과 보관 공간을 확인할",
    "upkeep": "소비기한 안에 먹을 양을 관리하는",
    "check": "소비기한 안에 먹을 계획이 있나요?",
    "alternative": "식품",
    "occasion": "먹을"
  },
  "hobby": {
    "activity": "계획한 취미 활동",
    "barrier": "기존 도구로 취미 활동을 하기 어려운",
    "benefit": "계획한 취미 활동을 하기",
    "setup": "활동할 시간과 필요한 환경을 마련할",
    "upkeep": "도구를 관리하고 정리하는",
    "check": "쓸 시간이 있나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "game": {
    "activity": "여가 시간의 게임",
    "barrier": "기존 게임이나 장비로 원하는 경험을 하기 어려운",
    "benefit": "원하는 게임 경험을 즐기기",
    "setup": "실행 환경과 플레이할 시간을 확인할",
    "upkeep": "추가 비용과 이용 시간을 관리하는",
    "check": "즐길 시간이 있나요?",
    "alternative": "물건",
    "occasion": "쓸"
  },
  "general": {
    "activity": "계획한 용도",
    "barrier": "현재 가진 물건으로 해결하기 어려운",
    "benefit": "필요한 용도를 충족하기",
    "setup": "사용에 필요한 조건을 확인할",
    "upkeep": "보관과 관리를 하는",
    "check": "쓸 계획이 있나요?",
    "alternative": "물건",
    "occasion": "쓸"
  }
} as const;

export const swipeProductRules = [
  [
    [
      "요가",
      "필라테스",
      "운동매트",
      "스트레칭",
      "yoga"
    ],
    "yoga"
  ],
  [
    [
      "키보드",
      "keyboard"
    ],
    "keyboard"
  ],
  [
    [
      "운동화",
      "러닝화",
      "런닝화",
      "신발",
      "스니커즈"
    ],
    "shoes"
  ],
  [
    [
      "필름",
      "화면보호",
      "화면 보호"
    ],
    "film"
  ],
  [
    [
      "미백",
      "치아",
      "치약"
    ],
    "whitening"
  ],
  [
    [
      "리무버",
      "클렌징",
      "remover"
    ],
    "remover"
  ]
] as const;

export const swipeCategoryProfiles = {
  "clothing": "clothes",
  "furniture": "furniture",
  "appliance": "appliance",
  "digital": "digital",
  "beauty": "beauty",
  "food": "food",
  "hobby": "hobby",
  "game": "game"
} as const;


export const SHORT_QUESTION_VERSION = "short-v1";
export const swipeUsePlans = {food: "소비기한 안에 먹을 수 있나요?", general: "꾸준히 쓸 시간이 있나요?"} as const;

export const foodQuestionWording: Record<string,string> = {
  "SW_PRE_NEED": "최근 먹을 것이 부족해 {item}이(가) 필요했나요?",
  "SW_PRE_WEEK_AGO": "일주일 전에도 {item}을(를) 먹고 싶었나요?",
  "SW_PRE_WEEK_LATER": "일주일 뒤에도 {item}을(를) 먹고 싶을까요?",
  "SW_PRE_ALTERNATIVE": "집에 있는 음식만으로는 부족해 {item}이(가) 필요한가요?"
};
