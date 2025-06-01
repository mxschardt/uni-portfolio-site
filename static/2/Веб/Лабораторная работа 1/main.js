// 2.1
// const str = 'aaa@bbb@ccc';
// const result = str.replace(/@/g, '!');

// result

// 2.2
// const str = 'aaa bbb ccc';
// const res1 = str.substr(4, 3);
// const res2 = str.substring(4, 7);
// const res3 = str.slice(4, 7);

// 2.3
// const date = '2025-12-31';
// const result = date.split('-').reverse().join('/');

// 2.4
// const lower = "JS".toLowerCase()
// const upper = "js".toUpperCase()

// upper
// lower

// 2.5
// const iLearnJS = "I learn JavaScript!"
// const str_len = iLearnJS.length
// const res1 = iLearnJS.substr(2, 5)
// const res2 = iLearnJS.substring(2, 7)
// const res3 = iLearnJS.slice(2, 7)
// const index = iLearnJS.indexOf("learn")

// str_len
// res1
// res2
// res3
// index

// const str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit"
// const n = 17
// const result_str = str.length > n ? str.slice(0, n) + "..." : str

// result_str

// 2.6
// const iLearnJS = "I-learn-JavaScript!"
// const result = iLearnJS.replace(/-/g, '!')

// result

// 2.7
// const iLearnJS = 'I learn JavaScript!';
// const words = iLearnJS.split(' ');
// const letters = iLearnJS.split('');

// words
// letters

// 2.8
// const date = '2025-12-31';
// const result = date.split('-').reverse().join('.');

// result

// 2.9
// const arr = ['I', 'learn', 'JavaScript', '!'];
// const result = arr.join('+');

// result

// 2.10
const str = "var_test_text"
const result = str
    .split("_")
    // Итерируем каждое слово
    .map((e, i) =>
        // Первое слово оставляем как есть, остальные с заглавной буквы
        i === 0 ? e : e.charAt(0).toUpperCase() + e.slice(1)
    )
    .join("")

result

// 2.11
function isPalindrome(str) {
    let left = 0,
        right = str.length - 1

    while (left < right) {
        if (str.charAt(left) !== str.charAt(right)) {
            return false
        }
        left++
        right--
    }

    return true
}

const palindrome = isPalindrome("level")
const notPalindrome = isPalindrome("palindrome")
palindrome
notPalindrome

// 2.12
function countVowels(str) {
    const vowels = ["a", "e", "i", "o", "u"]
    return (
        str
            // Находим все гласные
            .split("")
            .reduce((pre, cur) => {
                vowels.includes(cur.toLowerCase()) ? pre++ : pre
            }, 0)
    )
}

const test1 = countVowels("automobile")
const test2 = countVowels("Authentication")
test1
test2
