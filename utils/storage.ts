import {MMKV} from 'react-native-mmkv';
import {StorageFacade} from "@icure/cardinal-sdk";

export class MmkvStorageFacade implements StorageFacade {
	storage = new MMKV();
	setItem = async (key: string, value: string) => {
		return this.storage.set(key, value)
	};
	getItem = async (key: string) => {
		return this.storage.getString(key)
	};
	removeItem = async (key: string) => {
		this.storage.delete(key)
	};
}

export default new MmkvStorageFacade();