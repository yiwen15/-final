const fs = require('fs');

let fileContent = fs.readFileSync('data.js', 'utf8');

// 這裡撰寫所有替換的字典資料（人部）
const personDict = `
    // 3. 人部 (20 個)
    "你": { grade: "1A", zhuyin: "ㄋㄧˇ", comp: "person", definition: "稱呼對方（第二人稱）。", phrases: ["你好", "你們", "你的"], sentence: "認識你這位好朋友，我非常高興。", breakdown: ["亻", "爾"], logic: "面前的一個人。", story: "口訣：指著對面那（爾）個（人），就是你。" },
    "他": { grade: "1A", zhuyin: "ㄊㄚ", comp: "person", definition: "稱呼別人（第三人稱）。", phrases: ["他們", "他人", "其他"], sentence: "那個在空地踢球的小男孩就是他。", breakdown: ["亻", "也"], logic: "指別人。", story: "口訣：（也）就是那（人），指著遠方的別人稱呼為他。" },
    "們": { grade: "1A", zhuyin: "ㄇㄣ·", comp: "person", definition: "表示多數。", phrases: ["我們", "人們"], sentence: "我們全班都是最棒的好朋友。", breakdown: ["亻", "門"], logic: "門口站了一群人。", story: "口訣：大（門）口站了許多（人），聚在一起就是我們、好人們。" },
    "人": { grade: "1A", zhuyin: "ㄖㄣˊ", comp: "person", definition: "人類。", phrases: ["大人", "人物", "人群"], sentence: "馬路旁邊有許多忙碌的過路人。", breakdown: ["人"], logic: "象形字，側立的人。", story: "口訣：彎腰側立的形狀，我們都是互助互愛的人類。" },
    "像": { grade: "1B", zhuyin: "ㄒㄧㄤˋ", comp: "person", definition: "類似、如同。", phrases: ["好像", "畫像", "相像"], sentence: "妹妹長得好像小天使一樣可愛聰明。", breakdown: ["亻", "象"], logic: "人看到的樣子就像大象一樣鮮明。", story: "口訣：這個（人）高大得（象）頭大象，長得真像！" },
    "什": { grade: "1B", zhuyin: "ㄕㄣˊ", comp: "person", definition: "疑問詞。", phrases: ["什麼", "什麼事"], sentence: "你蹲在地上，到底在找什麼東西呢？", breakdown: ["亻", "十"], logic: "指許多交錯的人事物。", story: "口訣：看見十個人的交叉路口，不禁問一句『發生了什麼？』" },
    "但": { grade: "1B", zhuyin: "ㄉㄢˋ", comp: "person", definition: "不過、可是。", phrases: ["但是", "不但", "但願"], sentence: "我本來很想睡覺，但是好朋友找我出門玩。", breakdown: ["亻", "旦"], logic: "太陽升起後人轉身。", story: "口訣：太陽升起（旦），這個（人）雖然想睡覺，但還是起床了。" },
    "借": { grade: "1B", zhuyin: "ㄐㄧㄝˋ", comp: "person", definition: "暫用別人的東西。", phrases: ["借書", "借過", "借錢"], sentence: "我向學校漂亮的圖書館借了一本童話書。", breakdown: ["亻", "昔"], logic: "人與人過去的約定。", story: "口訣：因為往日（昔）的交情，這個人（亻）願意把東西借給我。" },
    "住": { grade: "1B", zhuyin: "ㄓㄨˋ", comp: "person", definition: "居留、居住。", phrases: ["居住", "住所", "留住"], sentence: "小鳥在綠色大樹上築了一個溫暖的巢住下來。", breakdown: ["亻", "主"], logic: "人停留做主人。", story: "口訣：這個（人）當了這個房子的（主）人，就在這裡住下來了。" },
    "做": { grade: "1B", zhuyin: "ㄗㄨㄛˋ", comp: "person", definition: "進行工作或活動。", phrases: ["做事", "做夢", "做功課"], sentence: "放學後，我認真做完老師交代的回家功課。", breakdown: ["亻", "故"], logic: "人有目的地行動。", story: "口訣：人（亻）為了一些原（故）而去努力做事。" },
    "健": { grade: "1B", zhuyin: "ㄐㄧㄢˋ", comp: "person", definition: "強壯、旺盛。", phrases: ["健康", "健保", "健壯"], sentence: "小馬每天認真跑步，身體長得非常健壯。", breakdown: ["亻", "建"], logic: "建立強壯的身體。", story: "口訣：這個（人）天天運動，（建）立起健壯的好身體。" },
    "候": { grade: "2A", zhuyin: "ㄏㄡˋ", comp: "person", definition: "時節；等待。", phrases: ["時候", "等候", "候鳥"], sentence: "等候公車需要耐心，千萬不要在路邊亂跑。", breakdown: ["亻", "侯"], logic: "人拿箭射標靶待命。", story: "口訣：人（亻）像諸（侯）一樣，在城門外靜靜等候。" },
    "件": { grade: "2A", zhuyin: "ㄐㄧㄢˋ", comp: "person", definition: "事物的量詞。", phrases: ["一件", "事件", "條件"], sentence: "這是一件幫助別人的好事，值得大家學習。", breakdown: ["亻", "牛"], logic: "人分開牛來數數。", story: "口訣：人（亻）牽著一條（牛），這是一件稀奇的事。" },
    "伸": { grade: "2A", zhuyin: "ㄕㄣ", comp: "person", definition: "展開、舒展。", phrases: ["伸手", "伸長", "伸展"], sentence: "早晨起床後，伸個大大的懶腰感覺真舒服。", breakdown: ["亻", "申"], logic: "人如閃電般伸直身子。", story: "口訣：人（亻）把身體像閃電一樣直直拉（申），這叫做伸展。" },
    "倒": { grade: "2A", zhuyin: "ㄉㄠˇ", comp: "person", definition: "傾跌。", phrases: ["跌倒", "倒下", "打倒"], sentence: "走路不小心踢到石頭，很容易會跌倒受傷。", breakdown: ["亻", "到"], logic: "人身來到地面。", story: "口訣：小（人）一走（到）這邊，碰的一聲不小心跌倒了。" },
    "介": { grade: "2A", zhuyin: "ㄐㄧㄝˋ", comp: "person", definition: "中間媒介。", phrases: ["介紹", "介入", "中介"], sentence: "透過熱心老師的介紹，我認識了新夥伴。", breakdown: ["人", "介"], logic: "人站在中間路口。", story: "口訣：一（人）站在兩旁中間，像橋梁一樣做介紹。" },
    "保": { grade: "2A", zhuyin: "ㄅㄠˇ", comp: "person", definition: "守護、不使其受損。", phrases: ["保護", "保險", "保衛"], sentence: "撐起這把堅固的雨傘，能保護我不被大雨淋濕。", breakdown: ["亻", "呆"], logic: "人抱著小孩。", story: "口訣：大（人）把傻（呆）純真的孩子緊緊抱住保護起來。" },
    "伴": { grade: "2B", zhuyin: "ㄅㄢˋ", comp: "person", definition: "一同生活或工作的人。", phrases: ["陪伴", "同伴", "伴侶"], sentence: "小黑狗是我最好最忠誠的玩伴，每天都陪我散步。", breakdown: ["亻", "半"], logic: "人的一半，同伴。", story: "口訣：這個（人）分我（半）塊大餅，他真是我最好的同伴。" },
    "傳": { grade: "2B", zhuyin: "ㄔㄨㄢˊ", comp: "person", definition: "遞送、交接。", phrases: ["傳球", "傳奇", "傳統"], sentence: "大隊接力賽跑時，我們要穩穩地把接力棒傳給下一位。", breakdown: ["亻", "專"], logic: "專心將事物遞交。", story: "口訣：這個（人）（專）心一意地把重要的信件傳送出去。" },
    "信": { grade: "2B", zhuyin: "ㄒㄧㄣˋ", comp: "person", definition: "誠實；信件。", phrases: ["相信", "信任", "寫信"], sentence: "我寫了一張長長的信紙，請郵差寄給遠方的爺爺。", breakdown: ["亻", "言"], logic: "人說出的話有信用。", story: "口訣：（人）說出來的話（言）一定要能讓人相信，不能撒謊。" },`;

fileContent = fileContent.replace(/\/\/ 3\. 人部 \(20 個\)[\s\S]*?\/\/ 4\. 口部 \(33 個\)/, personDict + '\n\n    // 4. 口部 (33 個)');

const mouthDict = `
    // 4. 口部 (33 個)
    "吹": { grade: "1A", zhuyin: "ㄔㄨㄟ", comp: "mouth", definition: "呼氣。", phrases: ["吹氣", "吹風", "吹牛"], sentence: "吃下生日蛋糕前，我用力吹熄了小蠟燭。", breakdown: ["口", "欠"], logic: "合口呵氣。", story: "口訣：嘴巴（口）大大張開打哈（欠），呼出一陣風就像在吹氣。" },
    "問": { grade: "1A", zhuyin: "ㄨㄣˋ", comp: "mouth", definition: "請教解答。", phrases: ["問題", "疑問", "請問"], sentence: "功課上有遇見不會的問題，勇敢開口問老師。", breakdown: ["門", "口"], logic: "在門邊張口打聽。", story: "口訣：走到大（門）旁，張開嘴巴（口）開聲請問別人的意見。" },
    "叫": { grade: "1A", zhuyin: "ㄐㄧㄠˋ", comp: "mouth", definition: "呼喊。", phrases: ["大叫", "叫聲", "叫醒"], sentence: "不要在安靜的醫院走廊上跑跳叫喊。", breakdown: ["口", "丩"], logic: "嘴巴發出長聲。", story: "口訣：嘴（口）裡發出的聲音（丩）被拉得很長，大聲叫起來。" },
    "嗎": { grade: "1A", zhuyin: "ㄇㄚ·", comp: "mouth", definition: "疑問詞。", phrases: ["好嗎", "是嗎"], sentence: "今天天氣這麼好，你要跟我一起出門走走嗎？", breakdown: ["口", "馬"], logic: "張口詢問之音。", story: "口訣：嘴巴（口）像（馬）兒叫一樣，滿口的好奇與問號。" },
    "哈": { grade: "1A", zhuyin: "ㄏㄚ", comp: "mouth", definition: "笑聲或呼氣。", phrases: ["哈哈", "哈欠", "哈氣"], sentence: "看見有趣的卡通，全家人都笑得哈哈大笑。", breakdown: ["口", "合"], logic: "笑得合不攏嘴。", story: "口訣：嘴巴（口）笑到快（合）不起來，發出哈哈哈的歡樂聲。" },
    "右": { grade: "1A", zhuyin: "ㄧㄡˋ", comp: "mouth", definition: "方位，與左相對。", phrases: ["右手", "右邊", "向右走"], sentence: "下樓梯時請靠右邊行走，以保安全。", breakdown: ["𠂇", "口"], logic: "手送食物入口的慣用手。", story: "口訣：我的（右）手拿著叉子，正要把好吃的東西送進嘴（口）裡。" },
    "和": { grade: "1A", zhuyin: "ㄏㄜˊ", comp: "mouth", definition: "平順；共同。", phrases: ["平和", "和氣", "我和你"], sentence: "我和可愛的妹妹一起分享香甜的大西瓜。", breakdown: ["禾", "口"], logic: "口吃禾穀而感到安順。", story: "口訣：吃下溫和的（禾）穀食物進嘴（口），脾氣也會變得和氣。" },
    "呀": { grade: "1B", zhuyin: "ㄧㄚ·", comp: "mouth", definition: "助詞，表驚訝。", phrases: ["哎呀", "好呀"], sentence: "哎呀！這多漂亮的花朵呀！", breakdown: ["口", "牙"], logic: "露牙發出讚嘆。", story: "口訣：嘴（口）打開露出了（牙）齒，發出驚訝的「呀」一聲。" },
    "唱": { grade: "1B", zhuyin: "ㄔㄤˋ", comp: "mouth", definition: "發聲歌詠。", phrases: ["唱歌", "合唱", "唱片"], sentence: "樹上的小鳥每天早晨都在開心地唱歌。", breakdown: ["口", "昌"], logic: "口發昌盛美音。", story: "口訣：嘴巴（口）高聲唱出興（昌）繁盛的動聽樂曲。" },
    "呢": { grade: "1B", zhuyin: "ㄋㄜ·", comp: "mouth", definition: "助詞，表疑問或肯定。", phrases: ["你在哪呢", "人呢"], sentence: "說好的太陽公公在哪裡呢？他被雲遮住了。", breakdown: ["口", "尼"], logic: "口部發音語氣。", story: "口訣：小（尼）姑開了口（口），用疑問語氣問了一聲「呢」。" },
    "吧": { grade: "1B", zhuyin: "ㄅㄚ·", comp: "mouth", definition: "商量助詞。", phrases: ["走吧", "好吧", "吃吧"], sentence: "天色不早了，我們趕快一起回家吃飯吧。", breakdown: ["口", "巴"], logic: "徵詢語氣之音。", story: "口訣：嘴（口）巴靠近別人像小蛇（巴）黏著，問句「好不好吧？」" },
    "啊": { grade: "1B", zhuyin: "ㄚ·", comp: "mouth", definition: "嘆詞。", phrases: ["啊對了", "啊呀"], sentence: "啊！這張畫畫得真是好生動啊。", breakdown: ["口", "阿"], logic: "張大嘴嘆氣。", story: "口訣：（阿）呆張大嘴（口），忽然想到一件事大叫「啊」！" },
    "咬": { grade: "1B", zhuyin: "ㄧㄠˇ", comp: "mouth", definition: "上下牙齒嚼斷食物。", phrases: ["咬斷", "咬碎", "咬一口"], sentence: "調皮的小狗緊緊咬住那根長長的骨頭。", breakdown: ["口", "交"], logic: "牙齒上下交錯。", story: "口訣：上下的牙與嘴（口）巴（交）錯在一起，一用力就咬斷了。" },
    "吃": { grade: "1B", zhuyin: "ㄔ", comp: "mouth", definition: "進食。", phrases: ["吃飯", "吃麵", "好吃"], sentence: "小雞在泥土地上到處找毛毛蟲吃。", breakdown: ["口", "乞"], logic: "口求食物。", story: "口訣：（乞）丐可憐地伸出碗，終於吃到了一（口）好飯。" },
    "哭": { grade: "1B", zhuyin: "ㄎㄨ", comp: "mouth", definition: "流淚悲泣。", phrases: ["哭聲", "哭泣", "愛哭"], sentence: "好朋友要搬家轉學了，我心裡很難過想哭。", breakdown: ["口", "口", "犬"], logic: "像狗叫樣流淚。", story: "口訣：小狗（犬）在外面大叫了兩聲（雙口），原來是難過得在哭。" },
    "呱": { grade: "2A", zhuyin: "ㄍㄨㄚ", comp: "mouth", definition: "擬聲詞。", phrases: ["呱呱叫", "呱噪"], sentence: "呱呱呱，池塘裡的鴨子在找尋好玩伴。", breakdown: ["口", "瓜"], logic: "口發刮聲。", story: "口訣：吃了大西（瓜），嘴（口）裡發出呱呱的響聲。" },
    "聞": { grade: "2A", zhuyin: "ㄨㄣˊ", comp: "mouth", definition: "聽見或用鼻子嗅。", phrases: ["新聞", "聞香", "見聞"], sentence: "遠處傳來了好聽的音樂，我仔細聽聞享受。", breakdown: ["門", "耳"], logic: "在門邊耳聽。", story: "口訣：站在大（門）旁邊，用（耳）朵專心聽各種新奇的見聞。" },
    "嘴": { grade: "2A", zhuyin: "ㄗㄨㄟˇ", comp: "mouth", definition: "口部。", phrases: ["嘴巴", "閉嘴", "嘴唇"], sentence: "說話時，最重要的就是這張能說出好話的嘴巴。", breakdown: ["口", "觜"], logic: "發聲的部位。", story: "口訣：鳥（觜）和人（口）一樣，都是用來吃東西和發聲的嘴。" },
    "名": { grade: "2A", zhuyin: "ㄇㄧㄥˊ", comp: "mouth", definition: "名稱或聲譽。", phrases: ["名字", "名片", "名氣"], sentence: "請在那張考卷上方，端正地寫下你的名字。", breakdown: ["夕", "口"], logic: "傍晚喊名。", story: "口訣：到了晚（夕）上看不見人，只好用嘴（口）大喊名字來找人。" },
    "哪": { grade: "2A", zhuyin: "ㄋㄚˇ", comp: "mouth", definition: "詢問。", phrases: ["在哪", "哪裡", "哪一個"], sentence: "你最喜歡哪一種顏色的漂亮衣服呢？", breakdown: ["口", "那"], logic: "問在那邊的事。", story: "口訣：嘴（口）巴問著（那）邊的事物，到底在哪裡呀？" },
    "盒": { grade: "2A", zhuyin: "ㄏㄜˊ", comp: "mouth", definition: "盛裝物品的器具。", phrases: ["盒子", "紙盒", "便當盒"], sentence: "這是我珍藏可愛小貼紙的祕密鐵盒子。", breakdown: ["合", "皿"], logic: "器皿蓋合。", story: "口訣：把器（皿）的蓋子（合）起來裝東西，這就是好用的盒子。" },
    "口": { grade: "2A", zhuyin: "ㄎㄡˇ", comp: "mouth", definition: "嘴巴或出入門戶。", phrases: ["口罩", "門口", "開口"], sentence: "出門時請記得戴好口罩保護呼吸道。", breakdown: ["口"], logic: "象形，張開的嘴。", story: "口訣：口裡說出的話要像糖果一樣甜甜的，大家才會喜歡你。" },
    "對": { grade: "2A", zhuyin: "ㄉㄨㄟˋ", comp: "mouth", definition: "正確的；面向。", phrases: ["答對", "對象", "面對"], sentence: "兩隻小鳥面對面站著，一起唱出美麗的好聽歌曲。", breakdown: ["業", "寸"], logic: "對準目標答理。", story: "口訣：用那一（寸）真心，（業）績一定會做對。" },
    "念": { grade: "2A", zhuyin: "ㄋㄧㄢˋ", comp: "mouth", definition: "思慮；大聲朗讀。", phrases: ["念書", "想念", "意念"], sentence: "把生字大聲地念出來，就能永遠記在心裡不會忘記。", breakdown: ["今", "心"], logic: "心中時刻記掛的。", story: "口訣：（今）天所學的事情，要用心（心）好好想念、反覆朗讀。" },
    "巴": { grade: "2A", zhuyin: "ㄅㄚ", comp: "mouth", definition: "蟲類形狀；期盼。", phrases: ["尾巴", "下巴", "巴望"], sentence: "小貓的尾巴毛茸茸的，一直開心地搖來搖去。", breakdown: ["巴"], logic: "像蛇捲曲附著。", story: "口訣：長得像是吐著舌頭的小蛇，緊緊巴在大樹幹上。" },
    "哇": { grade: "2B", zhuyin: "ㄨㄚ", comp: "mouth", definition: "嘆詞。", phrases: ["哇哇哭", "哇！"], sentence: "看到大象表演噴水，小朋友們都驚喜地驚呼：哇！", breakdown: ["口", "圭"], logic: "開口驚嘆。", story: "口訣：小青蛙大叫一聲，嚇得嘴（口）巴變成（圭）土般驚叫哇！" },
    "喝": { grade: "2B", zhuyin: "ㄏㄜ", comp: "mouth", definition: "飲用液體。", phrases: ["喝水", "喝茶", "好喝"], sentence: "天氣熱口渴時喝一杯冰涼的西瓜汁，感覺真清爽。", breakdown: ["口", "曷"], logic: "口渴而飲。", story: "口訣：嘴（口）裡覺得渴了（曷），就應該馬上喝一點涼水。" },
    "呵": { grade: "2B", zhuyin: "ㄏㄜ", comp: "mouth", definition: "呼氣笑聲。", phrases: ["呵呵", "呵護", "呵氣"], sentence: "看到小動物逗趣搞笑的模樣，我忍不住呵呵笑。", breakdown: ["口", "可"], logic: "呼氣之聲。", story: "口訣：張開嘴（口），用（可）愛的表情呼出一口氣，呵呵笑出聲。" },
    "呼": { grade: "2B", zhuyin: "ㄏㄨ", comp: "mouth", definition: "吐氣。", phrases: ["呼吸", "呼叫", "歡呼"], sentence: "森林裡的風呼呼地吹著，像在跟我們溫柔說話。", breakdown: ["口", "乎"], logic: "發聲呼呼氣。", story: "口訣：嘴（口）裡發出一陣風，大老遠都能（乎）然聽見呼喚。" },
    "吵": { grade: "2B", zhuyin: "ㄔㄠˇ", comp: "mouth", definition: "發出紛亂的聲音。", phrases: ["吵鬧", "吵架", "很吵"], sentence: "鄰居家養的鸚鵡一直大聲叫，吵個不停。", breakdown: ["口", "少"], logic: "少數人在爭執。", story: "口訣：就算只有（少）數的幾張嘴（口），也能吵翻了整個屋頂。" },
    "吐": { grade: "2B", zhuyin: "ㄊㄨˇ", comp: "mouth", definition: "由口排出。", phrases: ["吐出", "嘔吐", "吐氣"], sentence: "蠶寶寶吐出了細細長長的蠶絲，蓋了一個溫暖的家。", breakdown: ["口", "土"], logic: "口中排出物。", story: "口訣：吃壞了肚子，把泥（土）般的壞東西從口（口）中吐出去。" },
    "嚇": { grade: "2B", zhuyin: "ㄒㄧㄚ", comp: "mouth", definition: "使人害怕而吃驚。", phrases: ["嚇人", "驚嚇", "嚇到"], sentence: "那個大黑影突然間竄閃過，嚇得我趕快跑遠。", breakdown: ["口", "赫"], logic: "發出赫赫吼聲。", story: "口訣：嘴（口）裡發出可怕的威（赫）叫聲，把壞人都給嚇跑了。" },
    "告": { grade: "2B", zhuyin: "ㄍㄠˋ", comp: "mouth", definition: "稟報、告知。", phrases: ["告訴", "告別", "報告"], sentence: "比賽得了第一名，我要把這個好消息大聲告訴所有人。", breakdown: ["牛", "口"], logic: "牛觸角口述。", story: "口訣：用（牛）般的力氣大聲開口（口），把事情廣泛告知天下。" },`;

fileContent = fileContent.replace(/\/\/ 4\. 口部 \(33 個\)[\s\S]*?\/\/ 5\. 水部 \(30 個\)/, mouthDict + '\n\n    // 5. 水部 (30 個)');

fs.writeFileSync('data.js', fileContent);
console.log('Successfully updated person and mouth definitions in data.js');
