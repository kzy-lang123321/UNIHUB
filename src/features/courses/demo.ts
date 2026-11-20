import { Course } from "../../types";
import { seedCourse } from "./seed";

export const demoCourses: Course[] = [
  seedCourse,
  {
    ...seedCourse,
    code: "ICT-101",
    title: "Introduction to Computing",
    books: [],
    papers: [],
    units: [
      {
        no: 1,
        title: "Hardware & software",
        notes:
          "Hardware is the physical part of a computer: a keyboard, a screen, or a processor. Software is the set of instructions that tells that hardware what to do.\n\nThink of a phone. Its screen is hardware. The apps you open are software. Both work together to make the phone useful.",
        mcqs: [
          {
            question: "Which one is hardware?",
            options: [
              "A keyboard",
              "A web browser",
              "An operating system",
              "A text file",
            ],
            answer: 0,
            explanation:
              "A keyboard is a physical object. The other choices are software or data.",
          },
        ],
        sq: ["How are hardware and software different?"],
        lq: [
          "Describe how hardware and software work together when you type a message.",
        ],
      },
      {
        no: 2,
        title: "Connected. Or offline.",
        notes:
          "A network connects devices so they can share information. The internet connects many networks around the world.\n\nAn offline app saves information on your own device. Once your notes are saved, you can read them without an internet connection. New uploads still need a connection.",
        mcqs: [
          {
            question: "What can you do offline after saving a course?",
            options: [
              "Read its saved notes",
              "Fetch new uploads",
              "Open every publisher website",
              "Sync new cloud progress",
            ],
            answer: 0,
            explanation:
              "Saved notes stay on your device. Fetching or syncing new information needs a connection.",
          },
        ],
        sq: ["What is a network?"],
        lq: [
          "Explain one advantage and one limitation of an offline study app.",
        ],
      },
    ],
  },
  {
    ...seedCourse,
    code: "MATH-101",
    title: "Math for Clear Thinking",
    books: [],
    papers: [],
    units: [
      {
        no: 1,
        title: "A function is a rule",
        notes:
          "A function takes an input and produces an output using a rule. Imagine a machine that doubles every number you put into it.\n\nThe rule is f(x) = 2 × x. Put in 3 and the output is 6. Put in 5 and the output is 10. The rule stays the same.",
        mcqs: [
          {
            question: "If f(x) = 2 × x, what is f(3)?",
            options: ["2", "3", "6", "9"],
            answer: 2,
            explanation: "Replace x with 3: 2 × 3 = 6.",
          },
        ],
        sq: ["What are the input and output of a function?"],
        lq: ["Write a rule that adds 5 to its input, then test three inputs."],
      },
      {
        no: 2,
        title: "AND means both",
        notes:
          "A logical AND is true only when both statements are true. A logical OR is true when at least one statement is true.\n\nTo enter a room, you might need a ticket AND an ID. You need both. If you can pay with cash OR a card, either one is enough.",
        mcqs: [
          {
            question: "What is true AND false?",
            options: ["True", "False"],
            answer: 1,
            explanation:
              "AND needs both values to be true. One false value makes the result false.",
          },
        ],
        sq: ["When is a logical AND true?"],
        lq: ["Give an everyday example of AND and another example of OR."],
      },
    ],
  },
];
