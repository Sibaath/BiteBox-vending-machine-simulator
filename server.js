const express    = require("express");
const bodyParser = require("body-parser")
const path       = require("path");
const { isArray } = require("util");
const { SourceTextModule } = require("vm");
const { totalmem } = require("os");
const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'))

app.use(express.json());

app.get('/', (req, res) => {
    res.render('page1'); 
});

app.get('/vending',(req,res)=>
{
    res.render('page2');
})

app.post('/checkout', (req, res) => {
    const option = req.body.option;
    const amount = req.body.amount;

    if (option === 'finite') {
        res.render('page3finite', { total: amount });
    } else if (option === 'infinite') {
        res.render('page3infinite', { total: amount });
    } else {
        res.render('404');
    }
});

app.post('/infinite', (req, res) => {
    const selectedDenominations = req.body.selectedDenominations.split(",").map(Number);
    var amount = parseFloat(req.body.remAmount);
    var result = finitecoinChange(selectedDenominations,amount);
    if(amount==0)
        res.render('nochange',{ billTotal : req.body.amount,billPaid : req.body.amount});
    result.sort((a, b) => {
        return a.length - b.length || a.join('').localeCompare(b.join(''));
    });
    result = result.filter(combination => combination.length <= 5);

    let solutionCounts = [];

    result.forEach(solution => {
        let solutionCount = {};
        solution.forEach(coin => {
            solutionCount[coin] = (solutionCount[coin] || 0) + 1;
        });
        solutionCounts.push(solutionCount);
    });
    var value = amount+Number(req.body.amount);
    if(solutionCounts.length==0)
        res.render('exception',{ total : req.body.amount, option : 'infinite'})
    else
        res.render('page4',{solutions :solutionCounts , amountPaid : value, total : amount});
});

app.post('/finite',(req,res)=>
{
    const selectedDenominations = req.body.selectedDenominations.split(",").map(Number);
    const selectedQuantities    = req.body.selectedQuantities.split(",").map(Number);
    const amount                = parseFloat(req.body.remAmount);
    if(amount==0)
        return res.render('nochange',{ billTotal : req.body.amount,billPaid : req.body.amount});
    var result = [];
    generateCombinations(selectedDenominations, selectedQuantities, amount, 0, [], result);
    result.sort((a, b) => {
        return a.length - b.length || a.join('').localeCompare(b.join(''));
    });
    result = result.slice(0, 5)

    let solutionCounts = [];

    result.forEach(solution => {
        let solutionCount = {};
        solution.forEach(coin => {
            solutionCount[coin] = (solutionCount[coin] || 0) + 1;
        });
        solutionCounts.push(solutionCount);
    });
    var value = amount+Number(req.body.amount);
    console.log(solutionCounts);
    if(solutionCounts.length==0)
        res.render('exception',{ total : req.body.amount, option : 'finite'})
    else
        res.render('page4',{solutions : solutionCounts , amountPaid : value , total : amount});
})

function generateCombinations(coins, counts, amount, index, currentCombination, result) {
    if (amount === 0) {
        result.push([...currentCombination]);
        return;
    }

    if (amount < 0 || index === coins.length) {
        return;
    }

    for (let count = 0; count <= counts[index]; count++) {
        if (count * coins[index] <= amount) {
            for (let i = 0; i < count; i++) {
                currentCombination.push(coins[index]);
            }
            generateCombinations(coins, counts, amount - count * coins[index], index + 1, currentCombination, result);
            for (let i = 0; i < count; i++) {
                currentCombination.pop();
            }
        }
    }
}

function finitecoinChange(coins, amount) {
    const dp = [];
    for (let i = 0; i <= amount; i++) {
        dp.push([]);
    }
    dp[0].push([]);

    for (const coin of coins) {
        for (let i = coin; i <= amount; i++) {
            for (const combination of dp[i - coin]) {
                const newCombination = [...combination, coin];
                dp[i].push(newCombination);
            }
        }
    }

    return dp[amount];
}

app.listen(3001, () => {
    console.log("App listening");
});
