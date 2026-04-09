import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['poll', 'quiz'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  options: [{
    id: String,
    text: String
  }],
  correctAnswer: { // Only needed for quiz
    type: String 
  },
  timeLimit: { // In seconds
    type: Number,
    default: 30
  }
});

const responseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOption: {
    type: String,
    required: true
  },
  isCorrect: { // for quiz
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const participantSchema = new mongoose.Schema({
  id: String,
  joinedAt: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    default: 0
  }
});

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  currentQuestionIndex: {
    type: Number,
    default: -1 // -1 means no question is active
  },
  showResults: {
    type: Boolean,
    default: false
  },
  questions: [questionSchema],
  participants: [participantSchema],
  responses: [responseSchema]
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
