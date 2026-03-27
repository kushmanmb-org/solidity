const tape = require('tape');
const solc = require('../index.js');

const storageContractSource = [
    '// SPDX-License-Identifier: GPL-3.0',
    'pragma solidity >=0.8.0;',
    'contract Storage {',
    '    uint256 private value;',
    '    function store(uint256 newValue) public { value = newValue; }',
    '    function retrieve() public view returns (uint256) { return value; }',
    '}'
].join('\n');

tape('Contract Compilation', function (t) {
    t.test('Simple storage contract compiles successfully', function (st) {
        const input = {
            language: 'Solidity',
            sources: {
                'Storage.sol': {
                    content: storageContractSource
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']
                    }
                }
            }
        };

        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        st.ok(output, 'output is present');
        st.notOk(output.errors && output.errors.some(e => e.severity === 'error'), 'no compilation errors');
        st.ok(output.contracts, 'contracts field is present');
        st.ok(output.contracts['Storage.sol'], 'Storage.sol contracts are present');
        st.ok(output.contracts['Storage.sol'].Storage, 'Storage contract is present');

        const contract = output.contracts['Storage.sol'].Storage;
        st.ok(contract.abi, 'ABI is present');
        st.ok(Array.isArray(contract.abi), 'ABI is an array');
        st.ok(contract.abi.length > 0, 'ABI has entries');

        st.ok(contract.evm, 'EVM output is present');
        st.ok(contract.evm.bytecode, 'bytecode is present');
        st.ok(contract.evm.bytecode.object, 'bytecode object is present');
        st.ok(contract.evm.bytecode.object.length > 0, 'bytecode is non-empty');

        st.ok(contract.evm.deployedBytecode, 'deployed bytecode is present');
        st.ok(contract.evm.deployedBytecode.object, 'deployed bytecode object is present');
        st.ok(contract.evm.deployedBytecode.object.length > 0, 'deployed bytecode is non-empty');

        st.end();
    });

    t.test('ABI contains expected function signatures', function (st) {
        const input = {
            language: 'Solidity',
            sources: {
                'Storage.sol': {
                    content: storageContractSource
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi']
                    }
                }
            }
        };

        const output = JSON.parse(solc.compile(JSON.stringify(input)));
        const abi = output.contracts['Storage.sol'].Storage.abi;

        const storeEntry = abi.find(entry => entry.name === 'store');
        st.ok(storeEntry, 'store function is in ABI');
        st.equal(storeEntry.type, 'function', 'store is of type function');
        st.equal(storeEntry.inputs.length, 1, 'store has one input');
        st.equal(storeEntry.inputs[0].type, 'uint256', 'store input is uint256');

        const retrieveEntry = abi.find(entry => entry.name === 'retrieve');
        st.ok(retrieveEntry, 'retrieve function is in ABI');
        st.equal(retrieveEntry.type, 'function', 'retrieve is of type function');
        st.equal(retrieveEntry.outputs.length, 1, 'retrieve has one output');
        st.equal(retrieveEntry.outputs[0].type, 'uint256', 'retrieve output is uint256');

        st.end();
    });

    t.test('Invalid contract produces compilation errors', function (st) {
        const input = {
            language: 'Solidity',
            sources: {
                'Invalid.sol': {
                    content: 'contract Invalid { function broken( }'
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi']
                    }
                }
            }
        };

        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        st.ok(output.errors, 'errors field is present');
        st.ok(output.errors.length > 0, 'there are compilation errors');
        st.ok(output.errors.some(e => e.severity === 'error'), 'at least one error has severity error');

        st.end();
    });
});
