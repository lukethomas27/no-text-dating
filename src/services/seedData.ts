import { UserProfile } from '../types';

// Helper to create birthday from age
const birthdayFromAge = (age: number): string => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  return date.toISOString().split('T')[0];
};

// Seed data with 12 demo profiles using picsum.photos for placeholder images
export const SEED_PROFILES: UserProfile[] = [
  {
    id: 'demo-alex',
    name: 'Alex',
    birthday: birthdayFromAge(28),
    gender: 'man',
    sexuality: 'straight',
    showMe: 'women',
    prompts: [
      "I'm happiest when I'm hiking with my dog",
      "My ideal first date: coffee and a walk in the park",
      "Looking for someone who loves adventure",
    ],
    photos: [
      'https://picsum.photos/seed/alex1/400/600',
      'https://picsum.photos/seed/alex2/400/600',
    ],
    bio: "Software engineer by day, amateur chef by night. Let's skip the small talk!",
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-jordan',
    name: 'Jordan',
    birthday: birthdayFromAge(26),
    gender: 'woman',
    sexuality: 'bisexual',
    showMe: 'everyone',
    prompts: [
      "Coffee snob, but in a friendly way ☕",
      "I'll always share my fries with you",
      "Let's explore new restaurants together",
    ],
    photos: [
      'https://picsum.photos/seed/jordan1/400/600',
      'https://picsum.photos/seed/jordan2/400/600',
      'https://picsum.photos/seed/jordan3/400/600',
    ],
    bio: 'Foodie | Travel enthusiast | Looking for my adventure partner',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'demo-taylor',
    name: 'Taylor',
    birthday: birthdayFromAge(31),
    gender: 'woman',
    sexuality: 'straight',
    showMe: 'men',
    prompts: [
      "Weekend plans: farmers market then brunch",
      "I'm the friend who always has snacks",
      "Tell me about your favorite book",
    ],
    photos: [
      'https://picsum.photos/seed/taylor1/400/600',
      'https://picsum.photos/seed/taylor2/400/600',
    ],
    bio: 'Bookworm with a love for good conversation',
    createdAt: '2024-01-03T00:00:00.000Z',
  },
  {
    id: 'demo-morgan',
    name: 'Morgan',
    birthday: birthdayFromAge(29),
    gender: 'man',
    sexuality: 'gay',
    showMe: 'men',
    prompts: [
      "Music is my love language 🎵",
      "Always planning my next concert",
      "I make a mean playlist for road trips",
    ],
    photos: [
      'https://picsum.photos/seed/morgan1/400/600',
      'https://picsum.photos/seed/morgan2/400/600',
    ],
    bio: 'Vinyl collector, concert goer, and aspiring guitarist',
    createdAt: '2024-01-04T00:00:00.000Z',
  },
  {
    id: 'demo-casey',
    name: 'Casey',
    birthday: birthdayFromAge(27),
    gender: 'woman',
    sexuality: 'lesbian',
    showMe: 'women',
    prompts: [
      "Yoga in the morning, wine in the evening",
      "I believe in work-life balance",
      "Looking for genuine connection",
    ],
    photos: [
      'https://picsum.photos/seed/casey1/400/600',
    ],
    bio: 'Wellness coach helping people find their zen',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'demo-riley',
    name: 'Riley',
    birthday: birthdayFromAge(30),
    gender: 'man',
    sexuality: 'straight',
    showMe: 'women',
    prompts: [
      "Dog parent to a golden retriever 🐕",
      "Best conversation starter: pet pictures",
      "Outdoor enthusiast rain or shine",
    ],
    photos: [
      'https://picsum.photos/seed/riley1/400/600',
      'https://picsum.photos/seed/riley2/400/600',
      'https://picsum.photos/seed/riley3/400/600',
    ],
    bio: 'Veterinarian who never gets tired of animal facts',
    createdAt: '2024-01-06T00:00:00.000Z',
  },
  {
    id: 'demo-quinn',
    name: 'Quinn',
    birthday: birthdayFromAge(25),
    gender: 'non_binary',
    sexuality: 'pansexual',
    showMe: 'everyone',
    prompts: [
      "Artist seeking another creative soul",
      "Museums are my happy place",
      "I see beauty in everything",
    ],
    photos: [
      'https://picsum.photos/seed/quinn1/400/600',
      'https://picsum.photos/seed/quinn2/400/600',
    ],
    bio: 'Painter and photographer capturing life one frame at a time',
    createdAt: '2024-01-07T00:00:00.000Z',
  },
  {
    id: 'demo-avery',
    name: 'Avery',
    birthday: birthdayFromAge(33),
    gender: 'woman',
    sexuality: 'straight',
    showMe: 'men',
    prompts: [
      "Traveler with 30+ countries visited",
      "Always planning the next adventure",
      "Fluent in sarcasm and dad jokes",
    ],
    photos: [
      'https://picsum.photos/seed/avery1/400/600',
      'https://picsum.photos/seed/avery2/400/600',
    ],
    bio: 'Digital nomad working remotely from paradise',
    createdAt: '2024-01-08T00:00:00.000Z',
  },
  {
    id: 'demo-sam',
    name: 'Sam',
    birthday: birthdayFromAge(28),
    gender: 'man',
    sexuality: 'bisexual',
    showMe: 'everyone',
    prompts: [
      "Startup founder, eternal optimist",
      "I run on coffee and big ideas",
      "Looking for my co-pilot in life",
    ],
    photos: [
      'https://picsum.photos/seed/sam1/400/600',
    ],
    bio: 'Tech entrepreneur building the future, one line of code at a time',
    createdAt: '2024-01-09T00:00:00.000Z',
  },
  {
    id: 'demo-jamie',
    name: 'Jamie',
    birthday: birthdayFromAge(32),
    gender: 'woman',
    sexuality: 'straight',
    showMe: 'men',
    prompts: [
      "Chef by profession, foodie by choice",
      "I'll cook you dinner on our first date",
      "The way to my heart is through tacos",
    ],
    photos: [
      'https://picsum.photos/seed/jamie1/400/600',
      'https://picsum.photos/seed/jamie2/400/600',
    ],
    bio: 'Culinary school grad who believes food brings people together',
    createdAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'demo-drew',
    name: 'Drew',
    birthday: birthdayFromAge(29),
    gender: 'man',
    sexuality: 'straight',
    showMe: 'women',
    prompts: [
      "Fitness enthusiast, not a gym bro",
      "I run marathons for fun (yes, really)",
      "Balance is key - pizza after the gym",
    ],
    photos: [
      'https://picsum.photos/seed/drew1/400/600',
      'https://picsum.photos/seed/drew2/400/600',
      'https://picsum.photos/seed/drew3/400/600',
    ],
    bio: 'Personal trainer who loves outdoor adventures',
    createdAt: '2024-01-11T00:00:00.000Z',
  },
  {
    id: 'demo-blake',
    name: 'Blake',
    birthday: birthdayFromAge(27),
    gender: 'man',
    sexuality: 'queer',
    showMe: 'everyone',
    prompts: [
      "Film buff with strong opinions",
      "Always down for movie nights",
      "I quote movies in daily conversation",
    ],
    photos: [
      'https://picsum.photos/seed/blake1/400/600',
      'https://picsum.photos/seed/blake2/400/600',
    ],
    bio: 'Film critic and screenwriter in the making',
    createdAt: '2024-01-12T00:00:00.000Z',
  },
];
