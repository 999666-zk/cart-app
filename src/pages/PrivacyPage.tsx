import React, { useState, useEffect } from "react";
import { View, Button, StyleSheet } from "react-native";
import PrivacyPolicyModal from "../components/Privacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";

interface Props {
  navigation: StackNavigationProp<any>;
}
const App = (props: Props) => {
  const [modalVisible, setModalVisible] = useState(false);
  // storage
  const [data, setData] = useState([]);
  const handleShowModal = () => {
    setModalVisible(true);
    // readAllData();
    // console.log(data,'storage-agreed')
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    props.navigation.replace("signInWithCat");
  };

  useEffect(() => {
    // 获取手机中的隐私条款标识
    // readAllData();
    // console.log(data, "storage"); //[{"key": "hasLogined", "value": "false"}] storage
    // let res = AsyncStorage.getItem("isAgreed");
    let hasLogined = AsyncStorage.getItem("isAgreed");
    console.log(hasLogined, "pink");
    // 开始直接触发相关隐私条款
    handleShowModal();

    // 如果需要在组件卸载时清理副作用，可以返回一个清理函数
    return () => {
      console.log("Component unloaded");
    };
  }, []);

  const readAllData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      const parsedItems = items.map(([key, value]) => ({
        key,
        value,
      }));
      setData(parsedItems);
    } catch (error) {
      console.error("Error reading data:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* <Button title="显示隐私条款" onPress={handleShowModal} /> */}
      <PrivacyPolicyModal visible={modalVisible} onClose={handleCloseModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default App;
