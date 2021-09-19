import { Contract , Wallet} from "ethers";
import { contracts } from "../contracts";
import { consts, Network } from "./helpers/Constants";
import { Mode, TestEnv } from "./TestEnv";

export function getTestEnv(mode: Mode, chainId: number, alice: Wallet): TestEnv {
    let env: TestEnv = {} as TestEnv;
    env.chainId = chainId;
    let router: Contract, forge: Contract, data: Contract;
    if (chainId == Network.Mainnet) {
        router = new Contract(consts.address[Network.Mainnet].PENDLE_ROUTER, contracts.IPendleRouter.abi, alice);
        data = new Contract(consts.address[Network.Mainnet].PENDLE_DATA, contracts.IPendleData.abi, alice);
        env.router = router;
        env.data = data;
    } else {
        throw Error("Network not supported yet.")
    }
    if (mode == Mode.AAVE_V2) {

    }
    return env;
}