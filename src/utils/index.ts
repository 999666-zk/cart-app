import AsyncStorage from "@react-native-async-storage/async-storage";

const JPUSHREGISTERID = 'JPUSH_REGISTERID';
export function clearJPushRegisterId() {
    AsyncStorage.removeItem(JPUSHREGISTERID);
}

export async function setJPushRegisterId(text: string) {
    await AsyncStorage.setItem(JPUSHREGISTERID, text);
}

export async function getJPushRegisterId() {
    return AsyncStorage.getItem(JPUSHREGISTERID);
}

export const androidVersion:{[key:string]:any} = {
    'v33': '13.0',
    'v32': '12.0',
    'v31': '12.0',
    'v30': '11.0',
    'v29': '10.0',
    'v28': '9.0',
    'v27': '8.1',
    'v26': '8.0',
    'v25': '7.1.1',
    'v24': '7.0',
    'v23': '6.0',
    'v22': '5.1',
    'v21': '5.0',
    'v19': '4.4',
    'v18': '4.3',
    'v17': '4.2',
    'v16': '4.1',
    'v15': '4.0.3'
}