// 1.1
// const car = {
//     brand: "ford",
//     speed: "80",
//     accelerate: () => console.log("Hit the gas!"),
//     brake: () => console.log("Braking..."),
//     describe: () => console.log("The Ford Pinto is a subcompact car."),
// }
// car.accelerate()
// car.brake()
// car.describe()

// 1.2
// function Car(brand, speed, accelerate, brake, describe) {
//     this.brand = brand
//     this.speed = speed
//     this.brake = brake
//     this.describe = describe
//     this.accelerate = accelerate
// }

// 1.3
// class Car {
//     constructor(brand, speed, accelerate, brake, describe) {
//         this.brand = brand
//         this.speed = speed
//         this.brake = brake
//         this.describe = describe
//         this.accelerate = accelerate
//     }
// }

// const car = new Car(
//     "Volkswagen",
//     202,
//     () =>
//         console.log(
//             "First light commercial vehicle and second Volkswagen car model."
//         ),
//     () => console.log("Braking..."),
//     () => console.log("Accelerating...")
// )
// car.accelerate()
// car.brake()
// car.describe()
// 1.4
class Product {
    name // str
    price // number

    constructor(name, price) {
        this.name = name
        this.price = price
    }

    toString() {
        return this.name + ": $" + this.price
    }
}

class ShoppingCart {
    constructor(products) {
        this.products = products
    }

    addProduct(product) {
        this.products.push(product)
    }

    bill() {
        const formattedProducts =
            this.products
                .map((e, i) => `${i + 1}. ${e}`)
                .join("\n") + "\n"

        const totalCost = this.products.reduce(
            (total, current) => total + current.price,
            0
        )

        const bill = `${formattedProducts}\nTotal: $${totalCost}`
        console.log(bill)
        return bill
    }
}

// Create products
const products = [new Product("Apples", 1.28), new Product("Milk", 4.41)]
// Create shopping cart
const cart = new ShoppingCart(products)
// Add product to shopping cart
cart.addProduct(new Product("Cookies", 2.3))
// Print the bill
cart.bill()

// 1.5
class Clock {
    template // String
    timer

    constructor({ template }) {
        this.template = template
    }

    render() {
        let date = new Date()

        let hours = date.getHours()
        if (hours < 10) hours = "0" + hours

        let mins = date.getMinutes()
        if (mins < 10) mins = "0" + mins

        let secs = date.getSeconds()
        if (secs < 10) secs = "0" + secs

        let output = this.template
            .replace("h", hours)
            .replace("m", mins)
            .replace("s", secs)

        console.log(output)
    }

    stop() {
        clearInterval(this.timer)
    }

    start() {
        this.render()
        this.timer = setInterval(() => this.render(), 1000)
    }
}

class ExtendedClock extends Clock {
    precision

    constructor({ template, precision = 10000 }) {
        super({ template })
        this.precision = precision
    }

    start() {
        super.render()
        super.timer = setInterval(() => super.render(), this.precision)
    }
}

const clock = new ExtendedClock({ template: "h:m:s", precision: 100 })
clock.start()
setTimeout(() => clock.stop(), 1000)
