let sec = 50;
let getNum = 0;
let numOfSub = 6;
let isStarted = false;
let selected = -1;
let isFull = [];
let isDone = [];
let subType = [];
let timerInterval = null;
let isBlocked = false; 

let courses = [];

let queryTimestamp = null; // 조회한 시간 저장
let fullTimeout = null; // 만석 타이머

const splashIntroScreen = document.getElementById('splash-screen-intro');
const splashScreen = document.getElementById('splash-screen');
const settingsScreen = document.getElementById('settings-screen');
const mainScreen = document.getElementById('main-screen');
const subjectSlider = document.getElementById('subjectSlider');
const numDisplay = document.getElementById('numDisplay');
const startPracticeBtn = document.getElementById('startPracticeBtn');
const startBtn = document.getElementById('startBtn');
const enrolBtn = document.getElementById('enrolBtn');
const exitBtn = document.getElementById('exitBtn');
const curTimeLabel = document.getElementById('curTime');
const favListBody = document.getElementById('favListBody');
const getListBody = document.getElementById('getListBody');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

const refCode = document.getElementById('refCode');
const refSub = document.getElementById('refSub');
const refPoint = document.getElementById('refPoint');
const refProf = document.getElementById('refProf');
const refDay = document.getElementById('refDay');
const refTime = document.getElementById('refTime');
const refType = document.getElementById('refType');
const refCnt = document.getElementById('refCnt');
const refRoom = document.getElementById('refRoom');

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function showMessageBox(text, title, type, buttons) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'msgbox-overlay';

        let iconChar = '';
        if (type === 'info') iconChar = 'ℹ️';
        else if (type === 'error') iconChar = '❌';
        else if (type === 'warning') iconChar = '⚠️';
        else if (type === 'question') iconChar = '❓';

        let buttonsHTML = '';
        if (buttons === 'yesno') {
            buttonsHTML = `
                <button class="msgbox-btn" data-result="yes">예(Y)</button>
                <button class="msgbox-btn" data-result="no">아니오(N)</button>
            `;
        } else {
            buttonsHTML = `<button class="msgbox-btn" data-result="ok">확인</button>`;
        }

        overlay.innerHTML = `
            <div class="msgbox">
                <div class="msgbox-titlebar">
                    <span>${title}</span>
                </div>
                <div class="msgbox-body">
                    <span class="msgbox-body-icon">${iconChar}</span>
                    <span class="msgbox-body-text">${text}</span>
                </div>
                <div class="msgbox-buttons">
                    ${buttonsHTML}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelectorAll('.msgbox-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(btn.dataset.result);
            });
        });
    });
}

// ===== Screen 1: Title Splash =====
setTimeout(() => {
    splashScreen.style.display = 'none';
    splashIntroScreen.style.display = 'flex';
}, 1500);

// ===== Screen 2: Intro Splash =====
setTimeout(() => {
    splashIntroScreen.style.display = 'none';
    settingsScreen.style.display = 'flex';
}, 3000);

// ===== Screen 2: Settings =====
subjectSlider.addEventListener('input', () => {
    numDisplay.textContent = subjectSlider.value + '개';
});

startPracticeBtn.addEventListener('click', () => {
    numOfSub = parseInt(subjectSlider.value);
    settingsScreen.style.display = 'none';
    mainScreen.style.display = 'block';
    document.title = '광운대학교 수강신청 연습 프로그램';
    initMainScreen();
});

// ===== Screen 3: Main =====
function initMainScreen() {
    const dayList = ['월', '화', '수', '목', '금', '토', '일'];

    courses = [];
    favListBody.innerHTML = '';

    for (let i = 1; i <= numOfSub; i++) {
        const code = randInt(1000, 10000) + '-' + randInt(0, 10) + '-' + randInt(1000, 10000) + '-' + randInt(10, 100);
        const sub = '과목' + i;
        const point = randInt(1, 4).toString();
        const prof = '교수님' + i;
        const dayIdx = randInt(0, 7);
        const period = randInt(1, 9);
        const timeStr = dayList[dayIdx] + '(' + period + ')';

        courses.push({ code, sub, point, prof, time: timeStr, day: dayList[dayIdx], period: period.toString() });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><button class="fav-query-btn" data-index="${i - 1}">조회</button></td>
            <td>${i}</td>
            <td>${code}</td>
            <td>${sub}</td>
            <td>${point}</td>
            <td>${prof}</td>
            <td>${timeStr}</td>
        `;
        favListBody.appendChild(tr);
    }

    favListBody.querySelectorAll('.fav-query-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (isBlocked) return;
            onQueryClick(parseInt(btn.dataset.index));
        });
    });
}

// ===== Start Button =====
startBtn.addEventListener('click', async () => {
    startBtn.style.display = 'none';

    await showMessageBox(
        '10초 후 수강신청이 시작됩니다.\n서버 시간을 주목해주세요!',
        '수강신청 시작',
        'info',
        'ok'
    );

    // Start timer
    sec = 50;
    timerInterval = setInterval(timerTick, 1000);
});

// ===== Timer Tick =====
async function timerTick() {
    sec++;

    if (sec === 55) {
        curTimeLabel.classList.add('time-red');
    } else if (sec === 60) {
        clearInterval(timerInterval);
        timerInterval = null;
        curTimeLabel.textContent = '10:00:00';
        curTimeLabel.classList.remove('time-red');
        practiceStart();

        await showMessageBox(
            '수강신청이 시작되었습니다.',
            '수강신청 시작',
            'info',
            'ok'
        );
        return;
    }

    curTimeLabel.textContent = '09:59:' + sec;
}

// ===== Practice Start =====
function practiceStart() {
    isStarted = true;
    enrolBtn.disabled = false;
    enrolBtn.classList.add('enrol-btn-active');

    isFull = [];
    isDone = [];
    subType = [];

   for (let i = 0; i < numOfSub; i++) {
    isFull.push(randInt(0, 10) < 3);  // 30% chance 로 만석
    isDone.push(false);
    subType.push(randInt(0, 6));
}
}

function clearRef() {
    refCode.textContent = '';
    refSub.value = '';
    refPoint.value = '';
    refProf.value = '';
    refDay.value = '';
    refTime.value = '';
    refType.value = '';
    refCnt.textContent = '';
    refRoom.value = '';
}

// ===== Query Button Click =====
async function onQueryClick(index) {
    if (!isStarted) {
        await showMessageBox(
            '수강신청이 시작된 이후에만 조회가 가능합니다.',
            '수강신청 연습',
            'warning',
            'ok'
        );
        return;
    }

    const typeList = ['기필', '기선', '교필', '교선', '전필', '전선'];
    const delay = randInt(300, 500);

    isBlocked = true;
    loadingText.textContent = '조회 중...';
    loadingOverlay.style.display = 'flex';

    setTimeout(() => {
        loadingOverlay.style.display = 'none';
        isBlocked = false;

        selected = index;
        const course = courses[index];

        refCode.textContent = course.code;
        refSub.value = course.sub;
        refPoint.value = course.point;
        refProf.value = course.prof;
        refDay.value = course.day;
        refTime.value = course.period;
        refType.value = typeList[subType[index]];
        refCnt.textContent = isFull[index] ? '만석' : '여석';
        refRoom.value = '새404';

        // 조회 시간 기록
        queryTimestamp = Date.now();
        
        // 기존 타이머 있으면 취소
        if (fullTimeout) {
            clearTimeout(fullTimeout);
        }
        
        // 1.5초 후 만석으로 변경 
        if (!isFull[index]) {
            fullTimeout = setTimeout(() => {
                isFull[index] = true;
                refCnt.textContent = '만석';
                console.log(`과목 ${index + 1}이(가) 만석이 되었습니다.`);
            }, 1500);
        }
    }, delay);
}

enrolBtn.addEventListener('click', async () => {
    if (isBlocked) return;

    if (selected === -1) {
        await showMessageBox(
            '수강신청하려는 과목을 먼저 조회해주세요!',
            '오류',
            'warning',
            'ok'
        );
        return;
    }

    if (isDone[selected]) {
        await showMessageBox(
            '이미 수강신청이 완료된 과목입니다!',
            '수강신청 연습',
            'warning',
            'ok'
        );
        return;
    }

    // 조회 후 1.5초가 지났는지 확인
    const timeSinceQuery = Date.now() - queryTimestamp;
    if (timeSinceQuery > 1500 && !isFull[selected]) {
        // 1.5초가 지났다면 만석으로 변경
        isFull[selected] = true;
        refCnt.textContent = '만석';
    }

    if (isFull[selected]) {
        await showMessageBox(
            '해당 과목은 만석입니다.',
            '여석 없음',
            'error',
            'ok'
        );
        return;
    }

    const delay = randInt(1000, 1500);

    // Show loading overlay
    isBlocked = true;
    loadingText.textContent = '신청 중...';
    loadingOverlay.style.display = 'flex';

    setTimeout(() => {
        loadingOverlay.style.display = 'none';
        isBlocked = false;

        // 성공 시 타이머 취소
        if (fullTimeout) {
            clearTimeout(fullTimeout);
            fullTimeout = null;
        }

        getNum++;

        const typeList = ['기필', '기선', '교필', '교선', '전필', '전선'];
        const course = courses[selected];

        const tr = document.createElement('tr');
        tr.className = 'cyan-row';
        tr.innerHTML = `
            <td>${getNum}</td>
            <td>${course.code}</td>
            <td>${typeList[subType[selected]]}</td>
            <td>${course.sub}</td>
            <td>${course.point}</td>
            <td>${course.prof}</td>
            <td>${course.day}</td>
            <td>${course.period}교시</td>
            <td>새404</td>
            <td></td>
            <td></td>
            <td></td>
        `;
        getListBody.appendChild(tr);

        clearRef();
        isDone[selected] = true;
        document.title = '수강신청 성공 과목 수 [' + getNum + '/' + numOfSub + ']';
        selected = -1;
        queryTimestamp = null; // 타임스탬프 초기화
    }, delay);
});

// ===== Exit Button에 타이머 정리 추가 =====
exitBtn.addEventListener('click', async () => {
    const result = await showMessageBox(
        '수강신청 연습 프로그램을 종료하시겠습니까?',
        '수강신청 연습',
        'question',
        'yesno'
    );

    if (result === 'yes') {
        // Reset and go back to splash
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // ===== 새로 추가되는 부분 =====
        // 만석 타이머 정리
        if (fullTimeout) {
            clearTimeout(fullTimeout);
            fullTimeout = null;
        }
        // ===== 여기까지 =====

        // Reset state
        sec = 50;
        getNum = 0;
        isStarted = false;
        selected = -1;
        isFull = [];
        isDone = [];
        subType = [];
        courses = [];
        isBlocked = false;
        queryTimestamp = null; // 타임스탬프 초기화

        // Reset UI
        clearRef();
        getListBody.innerHTML = '';
        favListBody.innerHTML = '';
        curTimeLabel.textContent = '09:59:50';
        curTimeLabel.classList.remove('time-red');
        enrolBtn.disabled = true;
        enrolBtn.classList.remove('enrol-btn-active');
        startBtn.style.display = '';
        document.title = '광운대학교 수강신청 연습 프로그램';
        loadingOverlay.style.display = 'none';

        // Show splash
        mainScreen.style.display = 'none';
        splashScreen.style.display = 'flex';

        setTimeout(() => {
            splashScreen.style.display = 'none';
            splashIntroScreen.style.display = 'flex';
        }, 1500);

        setTimeout(() => {
            splashIntroScreen.style.display = 'none';
            settingsScreen.style.display = 'flex';
        }, 3000);
    }
});

