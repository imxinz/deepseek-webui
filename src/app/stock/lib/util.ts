/**
 * 三阳控三阴算法
 * 1. 阳多阴少
 * 2. 阳大阴小
 * 3. 阳密阴稀
 * @param data 
 * @param n 
 * @returns 
 */
function calculateConsecutiveRatio(data: any, n: number) {
    let upStreakCount = 0;
    let downStreakCount = 0;
    let currentUpStreak = 0;
    let currentDownStreak = 0;

    // 截取近 n 天的数据
    const recentData = data.slice(-n);

    for (let i = 1; i < recentData.length; i++) {
        const prevClose = recentData[i - 1].close;
        const currentClose = recentData[i].close;

        if (currentClose > prevClose) {
            // 阳线
            currentUpStreak++;
            currentDownStreak = 0;
            if (currentUpStreak === 3) {
                upStreakCount++;
            }
        } else if (currentClose < prevClose) {
            // 阴线
            currentDownStreak++;
            currentUpStreak = 0;
            if (currentDownStreak === 3) {
                downStreakCount++;
            }
        } else {
            // 平盘
            currentUpStreak = 0;
            currentDownStreak = 0;
        }
    }

    // 计算比例
    const ratio = downStreakCount === 0 ? Infinity : upStreakCount / downStreakCount;

    return {
        upStreakCount,
        downStreakCount,
        ratio
    };
}