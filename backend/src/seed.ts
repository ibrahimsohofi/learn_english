import bcrypt from 'bcryptjs';
import db, { initDatabase } from './config/database.js';

const sampleStories = [
  {
    title: 'The Little Red Hen',
    difficulty: 'beginner',
    text: `Once upon a time there was a little red hen. She lived on a farm with a dog, a cat, and a pig. One day the little red hen found some grains of wheat. Who will help me plant these grains? she asked. Not I said the dog. Not I said the cat. Not I said the pig. Then I will plant them myself said the little red hen. And she did.`,
    video_url: ''
  },
  {
    title: 'The Friendship',
    difficulty: 'intermediate',
    text: `Friendship is one of the most valuable treasures in life. True friends are there for you in good times and bad times. They listen when you need to talk and offer help without expecting anything in return. A real friend accepts you for who you are and helps you become the best version of yourself. Building strong friendships takes time, trust, and mutual respect.`,
    video_url: ''
  },
  {
    title: 'Climate Change',
    difficulty: 'advanced',
    text: `Climate change represents one of the most significant challenges facing humanity in the twenty-first century. The scientific consensus indicates that human activities, particularly the emission of greenhouse gases through fossil fuel combustion and deforestation, are driving unprecedented changes in global climate patterns. These alterations manifest through rising temperatures, shifting precipitation patterns, and increased frequency of extreme weather events.`,
    video_url: ''
  }
];

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    initDatabase();

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if admin exists
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@example.com');
    if (!existingAdmin) {
      db.prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
      ).run('Admin User', 'admin@example.com', hashedPassword, 'admin');
      console.log('✅ Admin user created (email: admin@example.com, password: admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create student user
    const studentPassword = await bcrypt.hash('student123', 10);
    const existingStudent = db.prepare('SELECT id FROM users WHERE email = ?').get('student@example.com');
    if (!existingStudent) {
      db.prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
      ).run('Student User', 'student@example.com', studentPassword, 'student');
      console.log('✅ Student user created (email: student@example.com, password: student123)');
    } else {
      console.log('ℹ️  Student user already exists');
    }

    // Add sample stories (clear existing ones first)
    const storyCount = db.prepare('SELECT COUNT(*) as count FROM stories').get() as { count: number };

    if (storyCount.count === 0) {
      const insertStory = db.prepare(
        'INSERT INTO stories (title, text, video_url, difficulty) VALUES (?, ?, ?, ?)'
      );

      for (const story of sampleStories) {
        insertStory.run(story.title, story.text, story.video_url, story.difficulty);
      }
      console.log(`✅ Added ${sampleStories.length} sample stories`);
    } else {
      console.log(`ℹ️  Stories already exist (${storyCount.count} stories in database)`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nYou can now login with:');
    console.log('  Admin: admin@example.com / admin123');
    console.log('  Student: student@example.com / student123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
