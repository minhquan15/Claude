// =====================================================================
//  NỘI DUNG CHỮ CỦA TOÀN BỘ ỨNG DỤNG — sửa nội dung chỉ cần sửa file này.
//  Tọa độ: đơn vị cách điệu, 1 đơn vị ≈ 1 µm ở bố cục tế bào đường kính ~20 µm.
//  `position`  : tâm bào quan (điểm camera nhìn tới khi chọn / tham quan).
//  `cam`       : hướng nhìn (dir, vector tương đối so với tâm) và khoảng cách (dist).
//  `label`     : điểm neo nhãn (có thể trùng position).
// =====================================================================

export const ORGANELLES = [
  {
    id: 'membrane',
    name: 'Màng sinh chất',
    en: 'Plasma membrane',
    color: '#f7a8c4',
    function:
      'Là lớp màng kép phospholipid có gắn protein, bao quanh tế bào. Màng có tính bán thấm: kiểm soát chất đi vào – đi ra, nhận tín hiệu từ môi trường và giúp tế bào nhận biết nhau. Ngay dưới màng là lớp vỏ sợi actin giữ hình dạng tế bào.',
    fact: 'Màng không phải một bức tường cứng: các phân tử phospholipid trôi trượt liên tục như chất lỏng, nên mô hình của màng gọi là "khảm động".',
    size: 'Dày khoảng 7–10 nm; cả tế bào thường rộng 10–30 µm',
    position: [0.6, 0.6, 8.6],
    cam: { dir: [0.35, 0.25, 1], dist: 7.5 },
    label: [-2.2, 6.4, 6.4],
  },
  {
    id: 'cytoplasm',
    name: 'Tế bào chất',
    en: 'Cytoplasm',
    color: '#bfe3ff',
    function:
      'Là phần nằm giữa màng sinh chất và nhân, gồm bào tương (dung dịch keo chứa nước, ion, đường, axit amin, protein) cùng các bào quan và bộ xương tế bào. Hầu hết các phản ứng chuyển hóa của tế bào diễn ra ở đây.',
    fact: 'Tế bào chất rất "đông đúc": protein và các đại phân tử chiếm một phần đáng kể thể tích, nên nó giống chất gel đặc hơn là nước loãng.',
    size: 'Chiếm phần lớn thể tích tế bào (khoảng 10–30 µm đường kính)',
    position: [1.5, -1.2, 5.6],
    cam: { dir: [0.1, 0.1, 1], dist: 9 },
    label: [4.4, -5.5, 4.2],
  },
  {
    id: 'nucleus',
    name: 'Nhân tế bào',
    en: 'Nucleus',
    color: '#8b8cff',
    function:
      'Chứa phần lớn vật chất di truyền (DNA) và điều khiển mọi hoạt động của tế bào. Nhân được bao bởi màng kép; trên màng có nhiều lỗ nhân cho phép RNA, protein ra vào. DNA liên kết với protein tạo thành chất nhiễm sắc.',
    fact: 'Nếu duỗi thẳng, DNA trong một nhân tế bào người dài khoảng 2 mét, vậy mà được cuộn gọn trong nhân chỉ rộng vài micromet.',
    size: 'Đường kính khoảng 5–10 µm; lỗ nhân rộng khoảng 100 nm',
    position: [-1.6, 0.2, 0],
    cam: { dir: [0.1, 0.25, 1], dist: 12 },
    label: [-2.8, 2.4, 3.3],
  },
  {
    id: 'nucleolus',
    name: 'Hạch nhân',
    en: 'Nucleolus',
    color: '#4f46e5',
    function:
      'Vùng đặc, không có màng bao nằm trong nhân. Đây là nơi tổng hợp rRNA và lắp ráp các tiểu đơn vị của ribosome trước khi chúng được đưa ra tế bào chất qua lỗ nhân.',
    fact: 'Tế bào cần tạo nhiều protein thì hạch nhân càng lớn và hoạt động mạnh, vì nó phải sản xuất rất nhiều ribosome.',
    size: 'Đường kính khoảng 0,5–3 µm',
    position: [-1.1, 0.7, 0.6],
    cam: { dir: [0.05, 0.2, 1], dist: 6 },
    label: [-1.1, 0.7, 1.5],
  },
  {
    id: 'rer',
    name: 'Lưới nội chất hạt',
    en: 'Rough endoplasmic reticulum',
    color: '#2fbfc7',
    function:
      'Hệ thống túi dẹt gấp nếp, màng ngoài của nhân nối liền với nó. Mặt ngoài có ribosome bám nên trông "sần". Đây là nơi tổng hợp protein tiết ra ngoài, protein màng và protein của lysosome, rồi gói vào túi vận chuyển đưa đến bộ máy Golgi.',
    fact: 'Ở các tế bào chuyên tiết protein, như tế bào sản xuất kháng thể, lưới nội chất hạt rất phát triển.',
    size: 'Túi dẹt, khoang bên trong rộng khoảng 20–50 nm',
    position: [-5.2, 2.6, 2.4],
    cam: { dir: [-0.3, 0.3, 1], dist: 9 },
    label: [-5.4, 4.6, 2.2],
  },
  {
    id: 'ser',
    name: 'Lưới nội chất trơn',
    en: 'Smooth endoplasmic reticulum',
    color: '#c084fc',
    function:
      'Mạng ống phân nhánh, nối tiếp với lưới nội chất hạt nhưng mặt ngoài không có ribosome. Tổng hợp lipid, chuyển hóa đường, khử độc và dự trữ ion canxi (Ca²⁺).',
    fact: 'Ở tế bào gan, lưới nội chất trơn giúp khử độc thuốc và rượu; ở tế bào cơ, nó dự trữ canxi cho sự co cơ.',
    size: 'Ống có đường kính khoảng 30–100 nm',
    position: [-5.8, -3.7, 1.5],
    cam: { dir: [-0.35, -0.3, 1], dist: 8 },
    label: [-6.9, -4.4, 2.2],
  },
  {
    id: 'ribosome',
    name: 'Ribosome',
    en: 'Ribosome',
    color: '#fde047',
    function:
      'Cấu tạo từ rRNA và protein, gồm hai tiểu đơn vị. Là nơi dịch mã, tức tổng hợp protein theo thông tin của mRNA. Ribosome có thể bám trên lưới nội chất hạt hoặc nằm tự do trong tế bào chất.',
    fact: 'Một tế bào người có thể chứa hàng triệu ribosome, và ribosome nào cũng chỉ "biết" làm một việc: nối các axit amin lại thành chuỗi.',
    size: 'Đường kính khoảng 25–30 nm (hình đã phóng đại nhiều lần)',
    position: [-4.2, 3.2, 3.4],
    cam: { dir: [-0.2, 0.4, 1], dist: 4.5 },
    label: [-4.2, 5.4, 4.6],
  },
  {
    id: 'golgi',
    name: 'Bộ máy Golgi',
    en: 'Golgi apparatus',
    color: '#fb923c',
    function:
      'Chồng túi dẹt xếp song song. Mặt cis hướng về lưới nội chất để nhận sản phẩm, mặt trans hướng ra phía màng để chuyển đi. Golgi sửa đổi (gắn đường, cắt gọt), phân loại và đóng gói protein, lipid vào túi tiết hoặc lysosome.',
    fact: 'Tên bộ máy được đặt theo nhà khoa học Camillo Golgi, người nhìn thấy cấu trúc này lần đầu năm 1898 nhờ nhuộm bạc.',
    size: 'Chồng 4–8 túi, mỗi túi rộng khoảng 1–3 µm',
    position: [4.6, 0.9, 1.6],
    cam: { dir: [0.25, 0.35, 1], dist: 6.5 },
    label: [4.8, 3.0, 3.0],
  },
  {
    id: 'vesicle',
    name: 'Túi vận chuyển và túi tiết',
    en: 'Transport and secretory vesicles',
    color: '#7dd3fc',
    function:
      'Các túi nhỏ có màng bao, tách ra từ lưới nội chất hoặc Golgi để chở protein và lipid đến nơi cần dùng. Túi tiết chứa sản phẩm đi ra màng sinh chất rồi hòa màng, đẩy chất ra ngoài tế bào (xuất bào).',
    fact: 'Túi hòa màng nên màng của túi trở thành một phần của màng sinh chất, góp phần làm tăng diện tích màng.',
    size: 'Đường kính khoảng 50–200 nm (túi tiết có thể lớn hơn)',
    position: [3.6, 2.9, 3.4],
    cam: { dir: [0.3, 0.25, 1], dist: 5 },
    label: [2.6, 4.9, 4.6],
  },
  {
    id: 'mitochondria',
    name: 'Ti thể',
    en: 'Mitochondria',
    color: '#f87171',
    function:
      'Bào quan có màng kép; màng trong gấp nếp thành các mào (cristae). Ti thể thực hiện hô hấp tế bào, phân giải chất hữu cơ khi có oxy để tạo ATP, nguồn năng lượng chính của tế bào.',
    fact: 'Ti thể có DNA vòng riêng và tự nhân đôi. Ở người, ti thể của con thường được di truyền từ mẹ.',
    size: 'Dài khoảng 1–2 µm, rộng khoảng 0,5–1 µm',
    position: [3.0, -4.6, 3.0],
    cam: { dir: [0.2, 0.2, 1], dist: 4.5 },
    label: [3.0, -6.3, 3.4],
  },
  {
    id: 'lysosome',
    name: 'Lysosome',
    en: 'Lysosome',
    color: '#22c55e',
    function:
      'Túi một lớp màng chứa nhiều enzyme thủy phân trong môi trường axit. Lysosome tiêu hóa thức ăn đưa vào tế bào, phân giải bào quan già hoặc hỏng và tiêu diệt vi khuẩn bị bắt giữ.',
    fact: 'Bên trong lysosome có độ pH khoảng 4,5–5, đủ axit để enzyme làm việc, còn ngoài tế bào chất pH gần trung tính nên enzyme rò ra cũng ít gây hại.',
    size: 'Đường kính khoảng 0,1–1 µm',
    position: [6.2, -1.8, 3.4],
    cam: { dir: [0.3, 0.1, 1], dist: 3.2 },
    label: [7.4, -3.2, 3.6],
  },
  {
    id: 'peroxisome',
    name: 'Peroxisome',
    en: 'Peroxisome',
    color: '#bef264',
    function:
      'Túi một lớp màng chứa các enzyme oxy hóa. Peroxisome phân giải một số axit béo và chất độc, đồng thời tạo ra H₂O₂, rồi enzyme catalase nhanh chóng biến H₂O₂ thành nước và oxy.',
    fact: 'Catalase là một trong những enzyme hoạt động nhanh nhất: một phân tử có thể phân giải hàng triệu phân tử H₂O₂ mỗi giây.',
    size: 'Đường kính khoảng 0,1–1 µm',
    position: [-5.8, 3.6, 3.8],
    cam: { dir: [-0.2, 0.2, 1], dist: 3.2 },
    label: [-6.6, 5.2, 4.2],
  },
  {
    id: 'centrosome',
    name: 'Trung thể',
    en: 'Centrosome',
    color: '#e879f9',
    function:
      'Gồm hai trung tử đặt vuông góc nhau, mỗi trung tử là 9 bộ ba vi ống xếp thành vòng. Trung thể là trung tâm tổ chức vi ống và tham gia hình thành thoi phân bào khi tế bào phân chia.',
    fact: 'Trung thể nhân đôi một lần trước mỗi lần phân bào, để hai cực của thoi phân bào mỗi cực có một trung thể.',
    size: 'Mỗi trung tử dài khoảng 0,4–0,5 µm, rộng khoảng 0,2 µm',
    position: [1.2, 3.6, 1.2],
    cam: { dir: [0.25, 0.5, 1], dist: 3.5 },
    label: [1.4, 5.4, 2.6],
  },
  {
    id: 'cytoskeleton',
    name: 'Bộ xương tế bào',
    en: 'Cytoskeleton',
    color: '#60a5fa',
    function:
      'Mạng sợi protein giữ hình dạng tế bào, neo giữ bào quan và làm "đường ray" vận chuyển. Gồm vi ống (xanh dương, tỏa ra từ trung thể), sợi trung gian (cam, giữ chắc nhân) và vi sợi actin (đỏ, tạo vỏ dưới màng).',
    fact: 'Các protein động cơ như kinesin "đi bộ" dọc vi ống, kéo túi vận chuyển với tốc độ khoảng 1 µm mỗi giây.',
    size: 'Vi ống rộng ~25 nm; sợi trung gian ~10 nm; vi sợi actin ~7 nm',
    position: [4.4, 4.6, 3.6],
    cam: { dir: [0.35, 0.25, 1], dist: 7 },
    label: [6.2, 4.6, 3.4],
  },
];

export const ORG = Object.fromEntries(ORGANELLES.map((o) => [o.id, o]));

// ---------------- Đường đi của protein ----------------
// duration (giây) của từng bước; vòng lặp liên tục.
export const PATHWAY_STEPS = [
  {
    id: 'rer',
    duration: 2.2,
    title: 'Tổng hợp trên lưới nội chất hạt',
    text: 'Ribosome bám trên lưới nội chất hạt tổng hợp protein, chuỗi polypeptide được đưa vào khoang của lưới nội chất.',
  },
  {
    id: 'transport',
    duration: 2.4,
    title: 'Túi vận chuyển tách ra',
    text: 'Protein được gói trong túi vận chuyển nảy chồi từ mép lưới nội chất rồi di chuyển về phía bộ máy Golgi.',
  },
  {
    id: 'cis',
    duration: 1.4,
    title: 'Hòa vào mặt cis của Golgi',
    text: 'Túi vận chuyển hòa màng với túi dẹt ở mặt cis, đổ protein vào bộ máy Golgi.',
  },
  {
    id: 'stack',
    duration: 3.0,
    title: 'Đi qua các túi Golgi',
    text: 'Protein lần lượt qua các túi dẹt, được gắn thêm đường, cắt gọt và hoàn thiện cấu trúc.',
  },
  {
    id: 'trans',
    duration: 1.4,
    title: 'Mặt trans: đóng gói, phân loại',
    text: 'Ở mặt trans, sản phẩm được phân loại và đóng gói vào túi tiết rồi nảy chồi ra khỏi Golgi.',
  },
  {
    id: 'secretory',
    duration: 2.6,
    title: 'Túi tiết di chuyển về màng',
    text: 'Túi tiết được vận chuyển dọc vi ống, tiến về phía màng sinh chất.',
  },
  {
    id: 'exocytosis',
    duration: 3.0,
    title: 'Hòa màng – xuất bào',
    text: 'Màng túi hòa vào màng sinh chất và đẩy protein ra ngoài tế bào. Màng của túi trở thành một phần của màng tế bào.',
  },
];

// Thứ tự các điểm dừng khi tham quan (id bào quan)
export const TOUR_ORDER = [
  'membrane', 'cytoplasm', 'nucleus', 'nucleolus', 'rer', 'ribosome', 'golgi',
  'vesicle', 'ser', 'mitochondria', 'lysosome', 'peroxisome', 'centrosome', 'cytoskeleton',
];
export const TOUR_DWELL_SECONDS = 6;

// ---------------- Chuỗi giao diện ----------------
export const UI = {
  appTitle: 'Tế bào động vật 3D',
  appSubtitle: 'Mô hình tế bào nhân thực · Sinh học 10',
  scaleNote: 'Tỉ lệ đã được phóng đại để dễ quan sát.',
  sizeLabel: 'Kích thước thật',
  funFactLabel: 'Điều thú vị',
  functionLabel: 'Chức năng',
  tabs: { list: 'Bào quan', info: 'Thông tin', tools: 'Công cụ' },
  listHeading: 'Chọn một bào quan',
  infoEmpty: 'Chạm vào một bào quan trong mô hình, hoặc chọn từ danh sách, để xem thông tin.',
  clearSelection: 'Bỏ chọn',
  tools: {
    slice: 'Cắt lớp',
    sliceAxis: 'Trục cắt',
    axisX: 'Trục X',
    axisY: 'Trục Y',
    axisZ: 'Trục Z',
    flip: 'Đổi phía cắt',
    labels: 'Nhãn',
    tour: 'Tham quan',
    pathway: 'Đường đi của protein',
    reset: 'Đặt lại góc nhìn',
    fullscreen: 'Toàn màn hình',
    credits: 'Nguồn tham khảo',
  },
  toolbar: {
    labelsOn: 'Bật nhãn',
    labelsOff: 'Tắt nhãn',
    reset: 'Đặt lại camera',
    fullscreen: 'Toàn màn hình',
    exitFullscreen: 'Thoát toàn màn hình',
    credits: 'Nguồn tham khảo',
    togglePanel: 'Mở hoặc đóng bảng điều khiển',
  },
  tour: {
    start: 'Bắt đầu tham quan',
    stop: 'Thoát tham quan',
    prev: 'Điểm trước',
    next: 'Điểm sau',
    pause: 'Tạm dừng',
    resume: 'Tiếp tục',
    stopOf: (i, n) => `Điểm ${i}/${n}`,
  },
  pathway: {
    start: 'Xem đường đi của protein',
    stop: 'Thoát chế độ này',
    stepOf: (i, n) => `Bước ${i}/${n}`,
    heading: 'Đường đi của protein xuất bào',
    prev: 'Bước trước',
    next: 'Bước sau',
  },
  loading: 'Đang tải mô hình…',
  loadingStages: ['Nạp thư viện', 'Dựng màng và nhân', 'Dựng lưới nội chất', 'Dựng bào quan', 'Dựng bộ xương', 'Hoàn tất'],
  noWebgl: {
    title: 'Không thể hiển thị mô hình 3D',
    body: 'Trình duyệt hoặc thiết bị của bạn chưa hỗ trợ WebGL, hoặc WebGL đang bị tắt. Hãy thử trình duyệt khác (Chrome, Firefox, Safari, Edge mới) hoặc bật tăng tốc phần cứng trong cài đặt.',
  },
  creditsTitle: 'Nguồn tham khảo',
  creditsLoadError: 'Không tải được CREDITS.md. Hãy chạy trang qua máy chủ tĩnh (xem README).',
  close: 'Đóng',
  canvasLabel: 'Mô hình tế bào động vật ba chiều. Kéo để xoay, cuộn hoặc chụm hai ngón để thu phóng.',
  sheetHandle: 'Kéo hoặc nhấn để mở rộng bảng điều khiển',
  selected: (name) => `Đã chọn: ${name}`,
};
