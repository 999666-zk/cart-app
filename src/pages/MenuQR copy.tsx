import React, { useState, useEffect, useRef } from "react";
import {
  Image,
  Text,
  View,
  StyleSheet,
  Button,
  ActivityIndicator,
  Animated,
  ImageBackground,
  Linking,
  Alert,
  Clipboard,
  default as Easing,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Dimensions } from "react-native";
import i18n from "../utils/i18n";
const { width } = Dimensions.get("window");
const qrSize = width * 0.85;

export default function MenuQR(props: any) {
  const [hasPermission, setHasPermission] = useState<any>(null);
  const [scanned, setScanned] = useState(false);
  // 动画初始化
  const moveAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    requesScanner();
    startAnimation();
  }, []);
  /** 扫描框动画*/
  const startAnimation = () => {
    Animated.sequence([
      Animated.timing(moveAnim, {
        toValue: 295,
        duration: 3000,
        useNativeDriver: false,
      }),
      Animated.timing(moveAnim, {
        toValue: 5,
        duration: 3000,
        useNativeDriver: false,
      }),
    ]).start(() => startAnimation());
  };
  const requesScanner = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const handleBarCodeScanned = ({ type, data }: any) => {
    setScanned(true);
    // alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    // 判断获取的内容
    let reg = /(http|https):\/\/([\w.]+\/?)\S*/gi;
    if (reg.test(data)) {
      // 跳转
      // setTimeout(()=>{
      //   Linking.openURL(data)
      // })
      setScanned(false);
      props.navigation.replace("browser", { appUrl: data });
      setScanned(true);
    } else {
      // 纯数据
      console.log(data);
      // props.navigation.push('qrdata',{data:data});
      Alert.alert(i18n.t("result"), `${data}`, [
        {
          text: i18n.t("close"),
          onPress: () => {
            setScanned(false);
          },
        },
        {
          text: `${i18n.t("copy")}`,
          onPress: () => {
            setScanned(false);
            Clipboard.setString(data);
            setScanned(true);
          },
        },
      ]);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.horizontal]}>
        <ActivityIndicator size="large" color="#f7ce46" />
      </View>
    );
  }
  if (hasPermission === false) {
    // 无权限back
    props.navigation.goBack();
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={[StyleSheet.absoluteFillObject, styles.container]}
      >
        {/* <Image
          style={styles.qr}
          source={require("../../assets/QRbackground.png")}
        /> */}
        <ImageBackground
          source={require("../../assets/QRbackground.png")}
          style={{ width: 300, height: 300 }}
        >
          <Animated.View
            style={[styles.border, { transform: [{ translateY: moveAnim }] }]}
          />
        </ImageBackground>
        <Text style={styles.rectangleText}>
          将二维码/条形码 放入框内，即可自动扫描
        </Text>
      </BarCodeScanner>
      {/* {scanned && (
        <Button color="#f7ce46" title={'重新展示扫码内容'} onPress={() => setScanned(false)} />
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,1)",
    padding: 8,
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  qr: {
    marginTop: "20%",
    marginBottom: "20%",
    width: qrSize,
    height: qrSize,
  },
  description: {
    fontSize: width * 0.06,
    marginTop: "10%",
    textAlign: "center",
    width: "100%",
    color: "white",
  },
  cancel: {
    fontSize: width * 0.05,
    textAlign: "center",
    width: "100%",
    color: "white",
  },
  border: {
    flex: 0,
    width: 290,
    marginLeft: 5,
    height: 1.5,
    backgroundColor: "#eaca3e",
    borderRadius: 50,
  },
  rectangleText: {
    flex: 0,
    color: "#fff",
    marginTop: 20,
    fontSize: 18,
  },
});
