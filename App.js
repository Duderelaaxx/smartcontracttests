import { useState } from 'react';
import {Api, JsonRpc} from "enf-eosjs";
import {JsSignatureProvider} from "enf-eosjs/dist/eosjs-jssig";
import AnchorLink from 'anchor-link';
import BrowserTransport from 'anchor-link-browser-transport';
//global.Buffer = global.Buffer || require('buffer').Buffer;

const waxtestnetid = "f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12"
function App() {
    const [username, setUsername] = useState('');

    const rpc = new JsonRpc('http://wax-test.blokcrafters.io');
    const privatekey = "5JhMSdoU6G57CVCoapGKTQwUsWX9tYzUNc6L9baujVV7vCn4ZP9"
    const signatureProvider = new JsSignatureProvider([privatekey])
    const api = new Api({rpc, signatureProvider})
    const transport = new BrowserTransport();
    const link = new AnchorLink({ transport, chains: [{ rpc, chainId: waxtestnetid, nodeUrl: "http://wax-test.blokcrafters.io" }] }); // replace CHAIN_ID with the actual chain ID

    const actions = [
        {
            account: 'cockojamboda',
            name: 'adduser',
            authorization: [
                {
                    actor: username,
                    permission: 'active',
                },
                {
                    actor: 'cockojamboda',
                    permission: 'active',
                },
            ],
            data: { username },
        },
    ];
    const addUser = async (event) => {
        event.preventDefault()

        const info = await rpc.get_info();
        const block = await rpc.get_block(info.last_irreversible_block_num);

        const tapos = {
            expiration: new Date(new Date(info.head_block_time + "Z").getTime() + 30000).toISOString().split('.')[0], //time in format 2023-09-07T11:00:42
            ref_block_num: info.last_irreversible_block_num & 0xFFFF, // last_irreversible_block_num truncated to 16 bits
            ref_block_prefix: block.ref_block_prefix,

        };
        try {
            const transaction = await api.transact(
                {
                    ...tapos,
                    actions,
                    resource_payer: {
                        payer: username,
                        max_net_bytes: 4096,
                        max_cpu_us: 400,
                        max_memory_bytes: 0,
                    },
                },
                {
                    sign: false,
                    broadcast: false,
                }
            )
            const serializedTransaction = api.serializeTransaction(transaction.transaction);
            const signResult = await signatureProvider.sign({ chainId: waxtestnetid, requiredKeys: ["EOS634CEp7rWEh3aJSfRNcYUZbkMfgpSgQ9TFxkedoMThFTVHSHNf"], serializedTransaction, abis: [] });
            const result = await link.transact(
                {
                    transaction: serializedTransaction,
                    availableKeys: await signatureProvider.getAvailableKeys(),
                    serializedTransaction,
                    signatures: signResult.signatures,
                },
                {
                    broadcast: true,
                }
            );


            console.log(transaction);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="App">
            <form onSubmit={addUser}>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <button>Add User</button>
            </form>
        </div>
    );
}

export default App;
