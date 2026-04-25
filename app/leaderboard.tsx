import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#09161f",
  surface: "#0d1e2b",
  border: "#162a3a",
  blue: "#2a6089",
  white: "#ffffff",
  sub: "#7a9ab5",
  muted: "#3d5a70",
  gold: "#FFD700",
  silver: "#A8B8C8",
  bronze: "#CD7F32",
  green: "#22c55e",
};

const PLAYERS = [
  {
    id: "1",
    name: "Alex Chen",
    dorm: "1204",
    points: 2840,
    missions: 47,
    streak: 12,
  },
  {
    id: "2",
    name: "Maya Patel",
    dorm: "2118",
    points: 2310,
    missions: 39,
    streak: 8,
  },
  {
    id: "3",
    name: "Jordan Lee",
    dorm: "3312",
    points: 1990,
    missions: 33,
    streak: 5,
  },
  {
    id: "4",
    name: "Sam Rivera",
    dorm: "4107",
    points: 1750,
    missions: 29,
    streak: 7,
  },
  {
    id: "5",
    name: "Riley Kim",
    dorm: "3415",
    points: 1520,
    missions: 25,
    streak: 3,
  },
  {
    id: "6",
    name: "Casey Wang",
    dorm: "5223",
    points: 1380,
    missions: 23,
    streak: 4,
  },
  {
    id: "7",
    name: "Taylor Brooks",
    dorm: "2109",
    points: 1240,
    missions: 21,
    streak: 2,
  },
  {
    id: "8",
    name: "Morgan Liu",
    dorm: "2301",
    points: 1100,
    missions: 18,
    streak: 6,
  },
  {
    id: "9",
    name: "Drew Santos",
    dorm: "5112",
    points: 980,
    missions: 16,
    streak: 1,
  },
  {
    id: "10",
    name: "Jamie Park",
    dorm: "6208",
    points: 840,
    missions: 14,
    streak: 3,
  },
  {
    id: "11",
    name: "Quinn Adams",
    dorm: "1331",
    points: 720,
    missions: 12,
    streak: 0,
  },
  {
    id: "12",
    name: "Avery Nguyen",
    dorm: "0215",
    points: 610,
    missions: 10,
    streak: 2,
  },
  {
    id: "13",
    name: "Blake Foster",
    dorm: "0108",
    points: 490,
    missions: 8,
    streak: 1,
  },
  {
    id: "14",
    name: "Cameron Wu",
    dorm: "2320",
    points: 380,
    missions: 6,
    streak: 0,
  },
  {
    id: "15",
    name: "Devon Hall",
    dorm: "1112",
    points: 260,
    missions: 4,
    streak: 0,
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type Rank = 1 | 2 | 3;

function PodiumCard({
  player,
  rank,
}: {
  player: (typeof PLAYERS)[0];
  rank: Rank;
}) {
  const medal = rank === 1 ? C.gold : rank === 2 ? C.silver : C.bronze;
  const baseH = rank === 1 ? 80 : rank === 2 ? 60 : 44;

  return (
    <View style={[s.podiumCard, rank === 1 && s.podiumCenter]}>
      {rank === 1 && (
        <Ionicons
          name="trophy"
          size={18}
          color={C.gold}
          style={{ marginBottom: 8 }}
        />
      )}
      <View style={[s.podiumAvatar, { borderColor: medal }]}>
        <Text style={s.podiumInitials}>{initials(player.name)}</Text>
      </View>
      <Text style={s.podiumName} numberOfLines={1}>
        {player.name.split(" ")[0]}
      </Text>
      <Text style={s.podiumDorm}>{player.dorm}</Text>
      <Text style={[s.podiumPts, { color: medal }]}>
        {player.points.toLocaleString()}
      </Text>
      {/* Podium base */}
      <View
        style={[
          s.podiumBase,
          {
            height: baseH,
            backgroundColor: medal + "18",
            borderColor: medal + "44",
          },
        ]}
      >
        <Text style={[s.podiumRankNum, { color: medal }]}>#{rank}</Text>
      </View>
    </View>
  );
}

function PlayerRow({
  player,
  rank,
}: {
  player: (typeof PLAYERS)[0];
  rank: number;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowRank}>{rank}</Text>
      <View style={s.rowAvatar}>
        <Text style={s.rowInitials}>{initials(player.name)}</Text>
      </View>
      <View style={s.rowInfo}>
        <Text style={s.rowName}>{player.name}</Text>
        <Text style={s.rowMeta}>
          {player.dorm} · {player.missions} missions
        </Text>
      </View>
      <View style={s.rowRight}>
        <Text style={s.rowPts}>{player.points.toLocaleString()}</Text>
        {player.streak > 0 && (
          <Text style={s.rowStreak}>🔥 {player.streak}</Text>
        )}
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={20} color={C.sub} />
        </Pressable>
        <Text style={s.headerTitle}>dormQuest</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.titleBig}>Top{"\n"}Players</Text>
          <Text style={s.titleSub}>this week's mission champions</Text>
        </View>

        {/* Stats strip */}
        <View style={s.statsStrip}>
          <View style={s.statItem}>
            <Text style={s.statValue}>15</Text>
            <Text style={s.statLabel}>Players</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>284</Text>
            <Text style={s.statLabel}>Missions</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>12</Text>
            <Text style={s.statLabel}>Top Streak</Text>
          </View>
        </View>

        {/* Podium */}
        <View style={s.podium}>
          <PodiumCard player={PLAYERS[1]} rank={2} />
          <PodiumCard player={PLAYERS[0]} rank={1} />
          <PodiumCard player={PLAYERS[2]} rank={3} />
        </View>

        {/* List */}
        <Text style={s.sectionLabel}>All Rankings</Text>
        {PLAYERS.slice(3).map((p, i) => (
          <PlayerRow key={p.id} player={p} rank={i + 4} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  /* Scroll */
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  /* Title */
  titleBlock: {
    paddingTop: 28,
    paddingBottom: 20,
  },
  titleBig: {
    color: C.white,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 44,
    marginBottom: 8,
  },
  titleSub: {
    color: C.muted,
    fontSize: 13,
    letterSpacing: 0.2,
  },

  /* Stats strip */
  statsStrip: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    marginBottom: 28,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: C.white,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    backgroundColor: C.border,
  },

  /* Podium */
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 32,
  },
  podiumCard: {
    flex: 1,
    alignItems: "center",
  },
  podiumCenter: {
    flex: 1.1,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.surface,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  podiumInitials: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
  },
  podiumName: {
    color: C.white,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
  },
  podiumDorm: {
    color: C.muted,
    fontSize: 11,
    marginBottom: 4,
  },
  podiumPts: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },
  podiumBase: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumRankNum: {
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 8,
  },

  /* List section */
  sectionLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  rowRank: {
    color: C.muted,
    fontSize: 14,
    fontWeight: "700",
    width: 26,
    textAlign: "center",
  },
  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#162a3a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginLeft: 8,
  },
  rowInitials: {
    color: C.sub,
    fontSize: 13,
    fontWeight: "700",
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    color: C.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowMeta: {
    color: C.muted,
    fontSize: 12,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowPts: {
    color: C.blue,
    fontSize: 14,
    fontWeight: "700",
  },
  rowStreak: {
    fontSize: 11,
    marginTop: 3,
  },
});
