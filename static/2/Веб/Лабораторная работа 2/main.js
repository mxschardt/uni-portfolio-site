// 1.1
function fillArray(value, count) {
    let result = []
    for (let i = 0; i < count; i++) result.push(value)
    console.log(result)
}

// 1.2
function reverse(array) {
    let result = []
    for (const val of array) result.unshift(val)
    return result
}

function reverseInPlace(array) {
    for (let i = 0; i < array.length / 2; i++) {
        const rightIdx = array.length - 1 - i
        // Swap right and left elemets
        ;[array[i], array[rightIdx]] = [array[rightIdx], array[i]]
    }
}

// 1.3
// Initial array and values to filter out
function filter(array, ...args) {
    // return array.filter((e) => !args.includes(e))
    let result = []
    for (const val of array) {
        if (!args.includes(val)) {
            result.push(val)
        }
    }
    return result
}

// 1.4
function flatten(array) {
    // return array.flat(Infinity);
    let result = []
    for (const val of array) {
        Array.isArray(val)
            ? // If element is an array, call flatten on it
              result.push(...flatten(val))
            : // Otherwise push the element to the end of result array
              result.push(val)
    }
    return result
}

// 1.5
function logMatrix(matrix) {
    for (const row of matrix) {
        console.log(...row)
    }
}

// 1.6
function oneSix() {
    const data = [
        { ip: "083.102.198.041" },
        { ip: "077.234.203.101" },
        { ip: "094.025.228.067" },
        { ip: "085.026.232.103" },
        { ip: "188.162.064.018" },
        { ip: "217.066.157.131" },
        { ip: "077.234.203.101" },
        { ip: "077.234.203.101" },
        { ip: "077.234.203.101" },
        { ip: "077.234.203.101" },
        { ip: "077.234.203.101" },
        { ip: "077.234.203.101" },
        { ip: "077.234.203.101" },
        { ip: "149.154.167.164" },
        { ip: "188.170.074.146" },
        { ip: "005.018.239.169" },
        { ip: "077.234.203.101" },
        { ip: "094.025.228.198" },
        { ip: "077.234.203.101" },
        { ip: "195.211.023.210" },
        { ip: "095.213.218.035" },
        { ip: "077.234.203.101" },
        { ip: "188.170.074.175" },
        { ip: "093.185.026.003" },
        { ip: "085.115.224.138" },
        { ip: "085.026.232.103" },
        { ip: "085.115.224.138" },
        { ip: "083.102.198.041" },
        { ip: "178.016.148.001" },
        { ip: "046.252.167.015" },
        { ip: "188.170.082.040" },
        { ip: "217.066.154.065" },
        { ip: "088.201.167.193" },
        { ip: "217.066.159.239" },
        { ip: "178.252.127.225" },
        { ip: "094.019.246.247" },
        { ip: "088.201.167.193" },
        { ip: "178.252.127.225" },
        { ip: "005.018.212.024" },
        { ip: "178.071.229.139" },
        { ip: "005.144.096.251" },
        { ip: "094.019.207.122" },
        { ip: "005.164.066.173" },
        { ip: "078.037.140.237" },
        { ip: "005.144.096.251" },
        { ip: "081.222.086.058" },
        { ip: "005.167.179.100" },
        { ip: "085.115.224.143" },
        { ip: "178.162.122.140" },
        { ip: "005.144.096.251" },
        { ip: "005.164.066.173" },
        { ip: "081.222.086.058" },
        { ip: "023.101.061.176" },
        { ip: "104.045.018.178" },
        { ip: "081.222.086.058" },
        { ip: "005.018.232.032" },
        { ip: "217.118.078.123" },
        { ip: "005.018.232.032" },
        { ip: "217.118.078.101" },
        { ip: "083.102.198.149" },
        { ip: "080.249.191.106" },
        { ip: "080.249.191.106" },
        { ip: "080.249.191.106" },
        { ip: "005.144.096.251" },
        { ip: "145.255.238.136" },
        { ip: "081.222.086.058" },
        { ip: "178.071.070.144" },
        { ip: "094.019.018.060" },
        { ip: "093.185.028.028" },
        { ip: "092.255.125.250" },
        { ip: "095.055.141.178" },
        { ip: "005.144.096.251" },
        { ip: "178.071.070.144" },
        { ip: "093.185.028.028" },
        { ip: "095.055.141.178" },
        { ip: "094.019.018.060" },
        { ip: "005.018.098.223" },
        { ip: "005.144.096.251" },
        { ip: "095.055.141.178" },
        { ip: "081.222.086.058" },
        { ip: "005.164.066.173" },
        { ip: "081.222.086.058" },
        { ip: "078.140.196.162" },
        { ip: "095.161.222.075" },
        { ip: "005.144.096.251" },
        { ip: "188.187.027.025" },
        { ip: "005.016.096.109" },
        { ip: "091.122.189.004" },
        { ip: "005.144.096.251" },
        { ip: "091.122.189.004" },
        { ip: "109.201.133.030" },
        { ip: "005.016.096.109" },
        { ip: "005.144.096.251" },
        { ip: "091.122.189.004" },
        { ip: "091.122.189.004" },
        { ip: "109.201.133.030" },
        { ip: "149.154.167.168" },
        { ip: "005.144.096.251" },
        { ip: "094.019.207.122" },
        { ip: "217.066.159.072" },
        { ip: "178.069.049.121" },
        { ip: "077.234.203.101" },
        { ip: "178.069.049.121" },
        { ip: "005.164.066.173" },
        { ip: "178.071.233.142" },
        { ip: "005.144.096.251" },
        { ip: "078.037.184.180" },
        { ip: "005.018.207.179" },
        { ip: "088.201.207.197" },
        { ip: "188.243.078.208" },
        { ip: "094.019.018.060" },
        { ip: "088.201.207.197" },
        { ip: "005.016.096.109" },
        { ip: "091.122.125.243" },
        { ip: "078.037.184.180" },
        { ip: "178.069.049.121" },
        { ip: "178.252.070.196" },
        { ip: "093.100.028.123" },
        { ip: "094.019.018.060" },
        { ip: "178.252.069.206" },
    ]

    const map = new Map()
    // Count how many times IPs appear in the data.
    for (const { ip } of data) {
        // Get value of IP. If IP is undefined, set it to 1, otherwise increment by 1
        map.set(ip, (map.get(ip) ?? 0) + 1)
    }
    // Convert to array and sort.
    const freq = Array.from(map).sort((a, b) => b[1] - a[1])
    const unique = freq.length
    const onlyOnce = freq.reduce((pre, cur) => (cur[1] == 1 ? pre + 1 : pre), 0)
    const max = freq.reduce((max, cur) => (cur[1] > max ? cur[1] : max), 0)

    console.log(freq)

    console.log(unique)
    console.log(onlyOnce)
    console.log(max)

}

oneSix()
