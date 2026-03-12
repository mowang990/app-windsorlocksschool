export type Role = "parent" | "teacher" | "admin";

export interface Child {
  id: string;
  name: string;
  ageMonths: number;
  avatarUrl: string;
  classId: string;
  interests: string[];
}

export type DevelopmentalTag = "communication" | "social-emotional" | "physical" | "early math" | "creativity";

export interface ActivityUpdate {
  id: string;
  childId: string;
  teacherId: string;
  timestamp: string;
  type: "photo" | "meal" | "nap" | "learning" | "milestone" | "mood" | "arrival" | "departure";
  content: string;
  contentSpanish?: string; // Mock translation
  imageUrl?: string;
  tags?: DevelopmentalTag[];
  mood?: "happy" | "calm" | "energetic" | "tired" | "fussy";
  aiGenerated?: boolean;
}

export interface WeeklySummary {
  id: string;
  childId: string;
  weekStarting: string;
  story: string;
  storySpanish?: string;
  suggestedHomeActivities: {
    title: string;
    description: string;
  }[];
}

export const childrenData: Child[] = [
  {
    id: "c1",
    name: "Leo",
    ageMonths: 24,
    avatarUrl: "https://i.pravatar.cc/150?img=11",
    classId: "cl1",
    interests: ["painting", "animals", "building blocks"]
  },
  {
    id: "c2",
    name: "Mia",
    ageMonths: 36,
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    classId: "cl1",
    interests: ["music", "dancing", "puzzles"]
  },
  {
    id: "c3",
    name: "Oliver",
    ageMonths: 48,
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    classId: "cl2",
    interests: ["dinosaurs", "running", "counting"]
  }
];

export const updatesData: ActivityUpdate[] = [
  {
    id: "u0",
    childId: "c1",
    teacherId: "t1",
    timestamp: new Date(new Date().setHours(8, 15, 0, 0)).toISOString(), // 8:15 AM
    type: "arrival",
    content: "Leo arrived with a big smile today! Ready to play.",
    contentSpanish: "¡Leo llegó con una gran sonrisa hoy! Listo para jugar.",
    mood: "happy"
  },
  {
    id: "u1",
    childId: "c1",
    teacherId: "t1",
    timestamp: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    type: "photo",
    content: "Leo showed great focus while mixing primary colors to create new shades! He proudly showed off his purple masterpiece.",
    contentSpanish: "¡Leo mostró gran concentración al mezclar colores primarios para crear nuevos tonos! Mostró con orgullo su obra maestra púrpura.",
    imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    tags: ["creativity", "early math"],
    aiGenerated: true
  },
  {
    id: "u2",
    childId: "c1",
    teacherId: "t1",
    timestamp: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
    type: "meal",
    content: "Ate all of his lunch (pasta and veggies). Tried a new vegetable today!",
    contentSpanish: "Comió todo su almuerzo (pasta y verduras). ¡Probó una verdura nueva hoy!",
    mood: "calm"
  },
  {
    id: "u5",
    childId: "c1",
    teacherId: "t1",
    timestamp: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
    type: "nap",
    content: "Slept soundly for 90 minutes.",
    contentSpanish: "Durmió profundamente durante 90 minutos.",
    mood: "tired"
  },
  {
    id: "u3",
    childId: "c1",
    teacherId: "t1",
    timestamp: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
    type: "learning",
    content: "We learned about different farm animals this morning. Leo could name the cow, pig, and sheep.",
    contentSpanish: "Aprendimos sobre diferentes animales de granja esta mañana. Leo pudo nombrar la vaca, el cerdo y la oveja.",
    tags: ["communication"]
  },
  {
    id: "u6",
    childId: "c1",
    teacherId: "t1",
    timestamp: new Date(new Date().setHours(16, 45, 0, 0)).toISOString(),
    type: "milestone",
    content: "Moment of Growth: Leo shared his toys without being prompted for the first time today during free play!",
    contentSpanish: "Momento de crecimiento: ¡Leo compartió sus juguetes sin que se lo pidieran por primera vez hoy durante el juego libre!",
    tags: ["social-emotional"]
  },
  {
    id: "u4",
    childId: "c2",
    teacherId: "t1",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    type: "nap",
    content: "Mia rested well. Slept for 1 hour and 15 mins.",
  }
];

export const weeklySummaries: WeeklySummary[] = [
  {
    id: "ws1",
    childId: "c1",
    weekStarting: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    story: "Leo had a wonderful week exploring his creative side! He showed immense curiosity in our color-mixing station and demonstrated growing social skills by taking turns with the building blocks. He's becoming more confident in expressing his needs verbally.",
    storySpanish: "¡Leo tuvo una semana maravillosa explorando su lado creativo! Mostró una inmensa curiosidad en nuestra estación de mezcla de colores y demostró crecientes habilidades sociales al turnarse con los bloques de construcción. Se está volviendo más seguro al expresar sus necesidades verbalmente.",
    suggestedHomeActivities: [
      {
        title: "Color Hunt",
        description: "Since Leo enjoyed color mixing, try a 'color hunt' around the house. Pick a color and see how many items he can find that match it."
      },
      {
        title: "Animal Sounds",
        description: "Build on his farm animal lesson by singing 'Old MacDonald' and taking turns making animal noises together."
      }
    ]
  }
];
