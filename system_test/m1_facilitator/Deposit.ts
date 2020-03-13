import Mosaic from 'Mosaic';
import Web3 from 'web3';

import config from './config';
import AddressHandler from '../common/AddressHandler';
import Faucet from '../common/Faucet';
import Utils from '../common/Utils';

export default class Deposit {
  public static async depositSystemTest(): Promise<void> {
    const { depositorCount } = config.testData.deposit;
    const { concurrencyCount } = config.testData.deposit;
    const { iterations } = config.testData.deposit;
    const { pollingInterval } = config.testData.deposit;
    const { timeoutInterval } = config.testData.deposit;
    const originWsEndpoint = config.chains.origin.wsEndpoint;
    const auxiliaryWsEndpoint = config.chains.auxiliary.wsEndpoint;
    const originChainId = config.chains.origin.chainId;

    const testDataObject = {};
    const initialOriginAccountBalance = {};
    const expectedOriginAccountBalance = {};
    const initialAuxiliaryAccountBalance = {};
    const finalAuxiliaryAccountBalance = {};

    let testDepositorAccounts = [];

    for (let i = 0; i < iterations; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      testDepositorAccounts = await AddressHandler.getRandomAddresses(
        depositorCount,
        concurrencyCount,
      );

      // eslint-disable-next-line no-await-in-loop
      await Faucet.fundAccounts(testDepositorAccounts, originChainId);

      const initialBalancePromises = testDepositorAccounts.map(
        async (account: any): Promise<void> => {
          const originBalance = await AddressHandler.getBalance(
            account.address,
            originWsEndpoint,
          );
          initialOriginAccountBalance[account.address] = originBalance;

          const auxiliaryBalance = await AddressHandler.getBalance(
            account.address,
            auxiliaryWsEndpoint,
          );
          initialAuxiliaryAccountBalance[account.address] = auxiliaryBalance;
        },
      );
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(initialBalancePromises);

      const depositTransactionPromises = testDepositorAccounts.map(
        async (account: any): Promise<void> => {
          const { txObject, depositAmount } = await this.createDepositTransactionObject(account);
          if (expectedOriginAccountBalance[account.address]) {
            expectedOriginAccountBalance[account.address] += depositAmount;
          } else {
            expectedOriginAccountBalance[account.address] = depositAmount;
          }
          // TODO: what should be the gasPrice?
          const txReceipt = await txObject.send({
            from: account.address,
            gasPrice: '0x3B9ACA00',
            gas: (await txObject.estimateGas({ from: account.address })),
          });

          const {
            amount,
            nonce,
            beneficiary,
            feeGasPrice,
            feeGasLimit,
            depositor,
            valueToken,
            messageHash,
          } = txReceipt.events.DepositIntentDeclared.returnValues;

          if (!testDataObject[i]) {
            testDataObject[i] = [];
          }
          testDataObject[i].push({
            amount,
            nonce,
            beneficiary,
            feeGasPrice,
            feeGasLimit,
            depositor,
            valueToken,
            messageHash,
          });
        },
      );

      // eslint-disable-next-line no-await-in-loop
      await Promise.all(depositTransactionPromises);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(done => setTimeout(done, pollingInterval));
    }

    await new Promise(done => setTimeout(done, timeoutInterval));

    const finalAuxiliaryBalancePromises = testDepositorAccounts.map(
      async (account: any): Promise<void> => {
        const auxiliaryBalance = await AddressHandler.getBalance(
          account.address,
          auxiliaryWsEndpoint,
        );
        finalAuxiliaryAccountBalance[account.address] = auxiliaryBalance;
      },
    );
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(finalAuxiliaryBalancePromises);

    // TODO: generate report
  }

  private static async createDepositTransactionObject(account: any): Promise<any> {
    const erc20GatewayAddress = config.chains.origin.gateway;
    const originWeb3 = new Web3(config.chains.origin.wsEndpoint);
    const erc20Gateway = Mosaic.interacts.getERC20Gateway(originWeb3, erc20GatewayAddress);

    const { minAmount } = config.testData.deposit;
    const { maxAmount } = config.testData.deposit;
    const testAmount = await Utils.getRandomNumber(minAmount, maxAmount);

    const { minGasPrice } = config.testData.deposit;
    const { maxGasPrice } = config.testData.deposit;
    const testGasPrice = await Utils.getRandomNumber(minGasPrice, maxGasPrice);

    const { minGasLimit } = config.testData.deposit;
    const { maxGasLimit } = config.testData.deposit;
    const testGasLimit = await Utils.getRandomNumber(minGasLimit, maxGasLimit);

    const { valueToken } = config.chains.origin;

    return {
      txObject: erc20Gateway.methods.deposit(
        testAmount,
        account.address,
        testGasPrice,
        testGasLimit,
        valueToken,
      ),
      depositAmount: testAmount,
    };
  }
}