const fs = require('fs');
const readline = require('readline');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify/sync');
// Reads a CSV file and converts it into a JavaScript object
function readCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// Writes (or overwrites) a JavaScript object to a CSV file
function writeCSVFile(filePath, data) {
    const csvString = stringify(data, { header: true });
    fs.writeFileSync(filePath, csvString);
}
// Adds a new entry to the specified CSV file (accounts or transactions)
async function createEntry(data, type) {
    const filePath = type === 'account' ? 'accounts.csv' : 'transactions.csv';
    let entries = await readCSVFile(filePath);
    entries.push(data);
    writeCSVFile(filePath, entries);
}

async function readEntry(id, type) {
    const filePath = type === 'account' ? 'accounts.csv' : 'transactions.csv';
    const entries = await readCSVFile(filePath);
    return entries.find(entry => entry.ID === id); // Use 'ID' for both types
}


async function updateEntry(identifier, updatedData, type) {
    const filePath = type === 'account' ? 'accounts.csv' : 'transactions.csv';
    let entries = await readCSVFile(filePath);
    const entryIndex = entries.findIndex(entry => entry.ID === identifier);

    if (entryIndex !== -1) {
        // Prevent updating ID
        delete updatedData.ID;
        entries[entryIndex] = { ...entries[entryIndex], ...updatedData };
        writeCSVFile(filePath, entries);
        return true;
    }

    return false;
}
function closeApplication() {
    rl.close();
    process.exit(0); // Properly exit the application
}

async function deleteEntry(identifier, type) {
    const filePath = type === 'account' ? 'accounts.csv' : 'transactions.csv';
    let entries = await readCSVFile(filePath);
    const filteredEntries = entries.filter(entry => entry.ID !== identifier);

    if (filteredEntries.length !== entries.length) {
        writeCSVFile(filePath, filteredEntries);
        return true;
    }

    return false;
}



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}
async function mainMenu() {
    console.log('\nMain Menu');
    console.log('1: Account Operations');
    console.log('2: Transaction Operations');
    console.log('3: Exit');

    const choice = await askQuestion('Enter your choice: ');
    switch (choice) {
        case '1':
            await accountOperationsMenu();
            break;
        case '2':
            await transactionOperationsMenu();
            break;
        case '3':
            closeApplication();
            break;
        default:
            console.log('Invalid choice. Please try again.');
            await mainMenu();
    }
}
async function exitSubMenu() {
    closeApplication();
}
async function accountOperationsMenu() {
    console.log('\nAccount Operations');
    console.log('1: Create Account');
    console.log('2: View Account');
    console.log('3: Update Account');
    console.log('4: Delete Account');
    console.log('5: Back to Main Menu');

    const choice = await askQuestion('Enter your choice: ');
    switch (choice) {
        case '1':
            await createEntity('account');
            break;
        case '2':
            await viewEntity('account');
            break;
        case '3':
            await updateEntity('account');
            break;
        case '4':
            await deleteEntity('account');
            break;
        case '5':
            await mainMenu();
            break;
        default:
            console.log('Invalid choice. Please try again.');
            await accountOperationsMenu();
    }
}
async function transactionOperationsMenu() {
    console.log('\nTransaction Operations');
    console.log('1: Create Transaction');
    console.log('2: View Transaction');
    console.log('3: Update Transaction');
    console.log('4: Delete Transaction');
    console.log('5: Back to Main Menu');

    const choice = await askQuestion('Enter your choice: ');
    switch (choice) {
        case '1':
            await createEntity('transaction');
            break;
        case '2':
            await viewEntity('transaction');
            break;
        case '3':
            await updateEntity('transaction');
            break;
        case '4':
            await deleteEntity('transaction');
            break;
        case '5':
            await mainMenu();
            break;
        default:
            console.log('Invalid choice. Please try again.');
            await transactionOperationsMenu();
    }
}
async function createEntity(type) {
    const data = {};
    const accountFields = ['ID', 'TYPE', 'NAME', 'DESCRIPTION', 'BALANCE_OPENING', 'BALANCE_CURRENT', 'CURRENCY'];
    const transactionFields = ['ID', 'DATE', 'DESCRIPTION', 'ACCOUNT_CODE', 'DEBIT_AMOUNT', 'CREDIT_AMOUNT', 'CURRENCY', 'PROOF', 'ISSUER', 'VALIDATOR', 'DATE_ENTRY'];

    const fields = type === 'account' ? accountFields : transactionFields;
    for (const field of fields) {
        let value = await askQuestion(`Enter ${field}: `);
        data[field] = value;
    }
    await createEntry(data, type);
    console.log(`${type} created successfully.`);

    // Return to the respective menu
    if (type === 'account') {
        await accountOperationsMenu();
    } else {
        await transactionOperationsMenu();
    }
}



// Function for Viewing an Entity (Account/Transaction)
async function viewEntity(type) {
    const id = await askQuestion('Enter ID: ');
    const entry = await readEntry(id, type);
    if (entry) {
        console.log(`${type} Details: `, entry);
    } else {
        console.log(`${type} not found.`);
    }
    // Return to the respective menu after displaying the details
    if (type === 'account') {
        await accountOperationsMenu();
    } else {
        await transactionOperationsMenu();
    }
}

async function updateEntity(type) {
    const identifier = await askQuestion(`Enter ID to update: `);
    const data = {};

    // Excluding 'ID' from update fields
    const accountUpdateFields = ['TYPE', 'NAME', 'DESCRIPTION', 'BALANCE_OPENING', 'BALANCE_CURRENT', 'CURRENCY'];
    const transactionUpdateFields = ['DATE', 'DESCRIPTION', 'ACCOUNT_CODE', 'DEBIT_AMOUNT', 'CREDIT_AMOUNT', 'CURRENCY', 'PROOF', 'ISSUER', 'VALIDATOR', 'DATE_ENTRY'];

    const updateFields = type === 'account' ? accountUpdateFields : transactionUpdateFields;
    for (const field of updateFields) {
        const newValue = await askQuestion(`Enter new ${field} (leave blank to keep current): `);
        if (newValue) {
            data[field] = newValue;
        }
    }

    const success = await updateEntry(identifier, data, type);
    if (success) {
        console.log(`${type} updated successfully.`);
    } else {
        console.log(`${type} not found or update failed.`);
    }

    // Return to the respective menu
    if (type === 'account') {
        await accountOperationsMenu();
    } else {
        await transactionOperationsMenu();
    }
}



async function deleteEntity(type) {
    const identifier = await askQuestion(type === 'account' ? 'Enter CODE to delete: ' : 'Enter ID to delete: ');
    const success = await deleteEntry(identifier, type);
    if (success) {
        console.log(`${type} deleted successfully.`);
    } else {
        console.log(`${type} not found or delete failed.`);
    }

    // Return to the respective menu
    if (type === 'account') {
        await accountOperationsMenu();
    } else {
        await transactionOperationsMenu();
    }
}


// Start the application
mainMenu();
