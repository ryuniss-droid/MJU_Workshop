

export const DOMAIN_OPTIONS = [
  {
    value: 'Product',
    label: '물리적 프로덕트 (Product)',
    description: '하드웨어의 형태, 재료, 조작 인터페이스 등 물리적 덩어리를 핵심적으로 디자인하는 도메인.',
  },
  {
    value: 'Experience Space',
    label: '경험 공간 (Experience Space)',
    description: '사용자가 머무는 장소의 분위기, 구조, 동선 등 물리적 환경을 다루는 도메인.',
  },
  {
    value: 'Transit System',
    label: '이동 시스템 (Transit System)',
    description: '사람이나 물건의 이동 수단 및 이를 운영하는 복합적인 모빌리티 하드웨어 시스템을 다루는 도메인.',
  },
  {
    value: 'Service System',
    label: '서비스 시스템 (Service System)',
    description: '사용자 경험(UX)의 흐름, UI, 프로세스, 데이터, 비즈니스 모델 등 무형의 시스템을 핵심적으로 다루는 도메인.',
  },
];

export const RELATIONSHIP_AXES = [
  {
    name: '행위적 관계 (Actional)',
    subCategories: [
      { name: '접근/이동', description: '인간이 대상으로 다가가거나 멀어지는 행위' },
      { name: '조작/작동', description: '손이나 몸으로 직접 작용하는 행위' },
      { name: '유발/반응', description: '대상이 인간 행동에 대응하는 방식' },
      { name: '전환/변화', description: '상태가 바뀌는 순간' },
    ],
  },
  {
    name: '감각적 관계 (Sensory)',
    subCategories: [
      { name: '시각적', description: '빛, 색, 형태의 변화' },
      { name: '청각적', description: '소리의 질감과 리듬' },
      { name: '촉각적', description: '표면, 온도, 질감' },
      { name: '운동감각', description: '몸의 움직임과 공간 경험' },
      { name: '공감각적', description: '여러 감각의 복합' },
    ],
  },
  {
    name: '의미적/상징적 관계 (Symbolic)',
    subCategories: [
      { name: '연결성', description: '인간-대상-환경의 결합' },
      { name: '공존성', description: '함께 있음, 균형' },
      { name: '반영성', description: '상호 인식과 미러링' },
      { name: '유인성', description: '끌어당김과 밀어냄' },
      { name: '전환성', description: '경계를 넘어서는 경험' },
    ],
  },
];

export const TEMPORALITY_OPTIONS = [
  '접촉 전 (Pre-contact)',
  '접촉 순간 (Contact)',
  '지속 (Duration)',
  '변화 (Transition)',
  '여운 (Aftermath)',
];

export const SPATIAL_SCOPE_OPTIONS = [
  '손-물체 (Intimate)',
  '몸 전체 (Bodily)',
  '공간 안 (Spatial)',
  '환경 전체 (Environmental)',
];