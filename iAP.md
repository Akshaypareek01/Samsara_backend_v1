Apple In-App Purchase Integration Guide
Samsara Wellness – Expo React Native + Node.js
Product Details
Subscription Name: Samsara Wellness Beta Plan
Product ID: com.samsara.wellness.monthly
Duration: 3 Months
Expo React Native (iOS)
Install dependency:
expo install expo-in-app-purchases
Initialize IAP:
import * as InAppPurchases from 'expo-in-app-purchases'; import { Platform } from 'react-native';
useEffect(() => { if (Platform.OS === 'ios') { InAppPurchases.connectAsync(); } return () => {
InAppPurchases.disconnectAsync(); }; }, []);
Start Purchase:
await InAppPurchases.purchaseItemAsync( 'com.samsara.wellness.monthly' );
Node.js Backend
Receipt Verification Endpoint:
POST https://buy.itunes.apple.com/verifyReceipt { "receipt-data": "", "password": "",
"exclude-old-transactions": true }
Recommended Database Fields:
1 userId
2 iosOriginalTransactionId
3 productId
4 subscriptionExpiry
5 isActive