// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   ScrollView,
// } from "react-native";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import { useAuthContext } from "@/context/AuthContext";
// import { Chat } from "@/types";
// import { db } from "@/firebase";
// import AntDesign from "@expo/vector-icons/AntDesign";
// import Feather from "@expo/vector-icons/Feather";
// import ParallaxScrollView from "@/components/ParallaxScrollView";
// import { Link } from "expo-router";
// const SharedChatsList = () => {
//   const { user } = useAuthContext();
//   const [chats, setChats] = useState<Chat[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [statistics, setStatistics] = useState({
//     totalChats: 0,
//     totalUpvotes: 0,
//     totalDownvotes: 0,
//     upvotePercentage: 0,
//   });

//   useEffect(() => {
//     const fetchChats = async () => {
//       if (!user) {
//         setError("User not authenticated");
//         setLoading(false);
//         return;
//       }

//       try {
//         const chatsQuery = query(
//           collection(db, "ChatsCollection"),
//           where("shared", "==", true),
//           where("userId", "==", user.uid)
//         );

//         const querySnapshot = await getDocs(chatsQuery);
//         const sharedChats = querySnapshot.docs.map((doc) => {
//           const data = doc.data();
//           return {
//             id: doc.id,
//             userId: data.userId as string,
//             messages: data.messages,
//             createdAt: data.createdAt,
//             shared: data.shared,
//             upvotes: data.upvotes || 0,
//             downvotes: data.downvotes || 0,
//           };
//         });

//         // Calculate statistics
//         const totalChats = sharedChats.length;
//         const totalUpvotes = sharedChats.reduce(
//           (sum, chat) => sum + (chat.upvotes || 0),
//           0
//         );
//         const totalDownvotes = sharedChats.reduce(
//           (sum, chat) => sum + (chat.downvotes || 0),
//           0
//         );
//         const upvotePercentage =
//           totalChats > 0
//             ? ((totalUpvotes / (totalUpvotes + totalDownvotes)) * 100).toFixed(
//                 2
//               )
//             : 0;

//         setStatistics({
//           totalChats,
//           totalUpvotes,
//           totalDownvotes,
//           upvotePercentage: Number(upvotePercentage),
//         });

//         setChats(sharedChats);
//       } catch (err) {
//         console.error("Error fetching chats:", err);
//         setError("Failed to fetch chats");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchChats();
//   }, [user]);

//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color={"lightblue"} />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
//       <View style={styles.container}>
//         <Text
//           style={[
//             styles.title,
//             statistics.upvotePercentage >= 90 && styles.yellowText,
//           ]}
//         >
//           Shared Chats
//         </Text>
//         <Text style={styles.subtitle}>
//           Click on a chat to see its messages and vote on them.
//         </Text>

//         <View style={styles.statsContainer}>
//           {/* Statistics Cards */}
//           <View style={styles.card}>
//             <Feather name="pie-chart" size={24} color="black" />
//             <Text style={styles.statValue}>{statistics.totalChats}</Text>
//             <Text style={styles.statLabel}>Total Shared Chats</Text>
//           </View>

//           <View style={styles.card}>
//             <AntDesign name="like2" size={24} color="green" />
//             <Text style={[styles.statValue, styles.greenText]}>
//               {statistics.totalUpvotes}
//             </Text>
//             <Text style={styles.statLabel}>Total Upvotes</Text>
//           </View>

//           <View style={styles.card}>
//             <AntDesign name="like2" size={24} color="purple" />
//             <Text style={[styles.statValue, styles.purpleText]}>
//               {statistics.upvotePercentage}%
//             </Text>
//             <Text style={styles.statLabel}>Upvote Percentage</Text>
//           </View>
//         </View>

//         {chats.length > 0 ? (
//           <FlatList
//             style={{ padding: 10, marginBottom: 55 }}
//             data={chats}
//             keyExtractor={(chat) => chat.id}
//             renderItem={({ item: chat }) => (
//               <View style={styles.chatItem}>
//                 <View
//                   style={{
//                     flexDirection: "row",
//                     justifyContent: "space-between",
//                   }}
//                 >
//                   <View style={styles.chatInfo}>
//                     <AntDesign name="user" size={16} color="black" />
//                     <Text style={styles.chatUserText}>
//                       Chat by You{/*  {user?.email} */}
//                     </Text>
//                   </View>

//                   <View style={styles.voteSection}>
//                     <View style={styles.voteInfo}>
//                       <AntDesign name="like2" size={14} color="purple" />
//                       <Text style={styles.voteCount}>{chat.upvotes}</Text>
//                     </View>
//                     <View style={styles.voteInfo}>
//                       <AntDesign name="dislike2" size={14} color="red" />
//                       <Text style={styles.voteCount}>{chat.downvotes}</Text>
//                     </View>
//                   </View>
//                 </View>

//                 <Link
//                   style={styles.viewChatButton}
//                   href={`https://curious-cranachan-ab9992.netlify.app/shared/${chat.id}`}
//                 >
//                   <TouchableOpacity>
//                     <Text style={styles.viewChatText}>View Chat</Text>
//                   </TouchableOpacity>
//                 </Link>
//               </View>
//             )}
//           />
//         ) : (
//           <Text style={styles.noChatsText}>No shared chats found.</Text>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: "lightGray",
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   errorText: {
//     color: "red",
//     fontSize: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 2,
//   },
//   yellowText: {
//     color: "yellow",
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "gray",
//     textAlign: "center",
//     marginBottom: 4,
//   },
//   statsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   card: {
//     backgroundColor: "white",
//     padding: 8,
//     borderRadius: 8,
//     alignItems: "center",
//     flex: 1,
//     marginHorizontal: 8,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   statValue: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginTop: 8,
//   },
//   statLabel: {
//     fontSize: 14,
//     color: "gray",
//     marginTop: 4,
//   },
//   greenText: {
//     color: "green",
//   },
//   purpleText: {
//     color: "purple",
//   },
//   chatItem: {
//     backgroundColor: "white",
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   chatInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   chatUserText: {
//     fontSize: 16,
//     color: "gray",
//     marginLeft: 8,
//   },
//   voteSection: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 8,
//     gap: 2,
//   },
//   voteInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   voteCount: {
//     fontSize: 16,
//     color: "gray",
//     marginLeft: 4,
//   },
//   viewChatButton: {
//     backgroundColor: "#2563eb",
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 6,
//     marginTop: 12,
//     alignItems: "center",
//   },
//   viewChatText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   noChatsText: {
//     textAlign: "center",
//     color: "gray",
//     fontSize: 16,
//   },
// });

// export default SharedChatsList;
import { StyleSheet, Text, View } from "react-native";
import React from "react";

const ShareChats = () => {
  return (
    <View>
      <Text>ShareChats</Text>
    </View>
  );
};

export default ShareChats;

const styles = StyleSheet.create({});
