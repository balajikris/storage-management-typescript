import * as msRest from 'ms-rest';
import * as msRestAzure from 'ms-rest-azure';

import StorageManagementClient = require('azure-arm-storage');
import { ResourceManagementClient, ResourceModels } from 'azure-arm-resource';
import * as StorageModels from '../node_modules/azure-arm-storage/lib/models';

class State {
    public clientId: string = process.env['CLIENT_ID'];
    public domain: string = process.env['DOMAIN'];
    public secret: string = process.env['APPLICATION_SECRET'];
    public subscriptionId: string = process.env['AZURE_SUBSCRIPTION_ID'];
    public options: string;
}

class StorageSample {
    private resourceGroupName = Helpers.generateRandomId('testrg');
    private storageAccountName = Helpers.generateRandomId('testacc');

    private location = 'westus';
    private accType = 'Standard_LRS';

    private resourceClient: ResourceManagementClient;
    private storageClient: StorageManagementClient;

    constructor(public state: State) {
    }

    public execute(): void {
        msRestAzure
            .loginWithServicePrincipalSecret(this.state.clientId, this.state.secret, this.state.domain, this.state.options)
            .then((credentials) => {
                this.resourceClient = new ResourceManagementClient(credentials, this.state.subscriptionId);
                this.storageClient = new StorageManagementClient(credentials, this.state.subscriptionId);
                this.createResourceGroup()
                    .then((rg) => {
                        console.log(`\n-->result of create resource group operation is ${JSON.stringify(rg)}`)
                        return this.createStorageAccount();
                    })
                    .then((sg) => {
                        console.log(`\n-->result of create storage acct operation is ${JSON.stringify(sg)}`)
                        return this.getStorageAccount();
                    })
                    .then((sg) => {
                        console.log(`\n-->result of get storage acct operation is ${JSON.stringify(sg)}`)
                        return this.listStorageAccountsByResourceGroup();
                    })
                    .then((sgAccts) => {
                        console.log(`\n-->result of list storage accts by resource group is ${JSON.stringify(sgAccts)}`)
                        return this.listStorageAccounts();
                    })
                    .then((sgAccts) => {
                        console.log(`\n-->result of list storage accts operation is ${JSON.stringify(sgAccts)}`)
                        return this.listStorageAccountKeys();
                    })
                    .then((keysList) => {
                        console.log(`\n-->result of list storage acct keys operation is ${JSON.stringify(keysList)}`)
                        return this.regenerateStorageAccountKeys();
                    })
                    .then((keysList) => {
                        console.log(`\n-->result of regenerate storage acct keys operation is ${JSON.stringify(keysList)}`)
                        return this.updateStorageAccount();
                    })
                    .then((sg) => {
                        console.log(`\n-->result of update storage acct operation is ${JSON.stringify(sg)}`)
                        return this.checkNameAvailability();
                    })
                    .then((checkNameResult) => {
                        console.log(`\n-->result of check name operation is ${JSON.stringify(checkNameResult)}`)
                        return this.listUsage();
                    })
                    .then((usageList) => {
                        console.log(`\n-->result of list usage operation is ${JSON.stringify(usageList)}`)
                        console.log(`\n####Successfully completed all operations on storage account####`);
                    })
            })
            .catch((error) => console.log(`Error occurred: ${error}`));
    }

    private createResourceGroup(): Promise<ResourceModels.ResourceGroup> {
        let groupParameters: ResourceModels.ResourceGroup = {
            location: this.location
        };

        console.log(`\n1. Creating resource group: ${this.resourceGroupName}`);
        return this.resourceClient.resourceGroups.createOrUpdate(this.resourceGroupName, groupParameters);
    }

    private createStorageAccount(): Promise<StorageModels.StorageAccount> {
        let createParams: StorageModels.StorageAccountCreateParameters = {
            location: this.location,
            sku: { name: this.accType },
            kind: 'Storage'
        };

        console.log(`\n2. Creating storage account: ${this.storageAccountName}`);
        return this.storageClient.storageAccounts.create(this.resourceGroupName, this.storageAccountName, createParams);
    }

    private listStorageAccountsByResourceGroup(): Promise<StorageModels.StorageAccountListResult> {
        console.log(`\n3. Listing storage accounts in the resourceGroup : ${this.resourceGroupName}`);
        return this.storageClient.storageAccounts.listByResourceGroup(this.resourceGroupName);
    }

    private listStorageAccounts(): Promise<StorageModels.StorageAccountListResult> {
        console.log('\n4. Listing storage accounts in the current subscription.');
        return this.storageClient.storageAccounts.list();
    }

    private listStorageAccountKeys(): Promise<StorageModels.StorageAccountListKeysResult> {
        console.log(`\n5. Listing storage account keys for account: + ${this.storageAccountName}`);
        return this.storageClient.storageAccounts.listKeys(this.resourceGroupName, this.storageAccountName);
    }

    private regenerateStorageAccountKeys(): Promise<StorageModels.StorageAccountListKeysResult> {
        console.log(`\n6. Regenerating storage account keys for account: ${this.storageAccountName}`);
        return this.storageClient.storageAccounts.regenerateKey(this.resourceGroupName, this.storageAccountName, 'key1');
    }

    private getStorageAccount(): Promise<StorageModels.StorageAccount> {
        console.log(`\n7. Getting info of storage account: ${this.storageAccountName}`);
        return this.storageClient.storageAccounts.getProperties(this.resourceGroupName, this.storageAccountName);
    }

    private updateStorageAccount(): Promise<StorageModels.StorageAccount> {
        var updateParameters = {
            sku: {
                name: 'Standard_GRS'
            }
        };
        console.log(`\n8. Updating storage account : ${this.storageAccountName} `);
        return this.storageClient.storageAccounts.update(this.resourceGroupName, this.storageAccountName, updateParameters, );
    }

    private checkNameAvailability(): Promise<StorageModels.CheckNameAvailabilityResult> {
        console.log(`\n9. Checking if the storage account name : ${this.storageAccountName}  is available.`);
        return this.storageClient.storageAccounts.checkNameAvailability(this.storageAccountName, );
    }

    private listUsage(): Promise<StorageModels.UsageListResult> {
        console.log('\n10. List Usage for Storage Accounts in the current subscription: \n');
        return this.storageClient.usageOperations.list();
    }
}

class Helpers {
    static generateRandomId(prefix: string): string {
        return prefix + Math.floor(Math.random() * 10000);
    }

    static validateEnvironmentVariables(): void {
        let envs = [];
        if (!process.env['CLIENT_ID']) envs.push('CLIENT_ID');
        if (!process.env['DOMAIN']) envs.push('DOMAIN');
        if (!process.env['APPLICATION_SECRET']) envs.push('APPLICATION_SECRET');
        if (!process.env['AZURE_SUBSCRIPTION_ID']) envs.push('AZURE_SUBSCRIPTION_ID');
        if (envs.length > 0) {
            throw new Error(`please set/export the following environment variables: ${envs.toString()}`);
        }
    }
}

main();

function main() {
    Helpers.validateEnvironmentVariables();
    let state = new State();
    let driver = new StorageSample(state);
    driver.execute();
}
