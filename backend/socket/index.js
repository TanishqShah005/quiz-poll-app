import Room from '../models/Room.js';

export const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ----- PARTICIPANT EVENTS -----
    
    // Join a room as participant
    socket.on('join_room', async ({ roomCode, userId }, callback) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room) {
          return callback({ error: 'Room not found' });
        }
        
        // Add to socket room
        socket.join(roomCode);
        
        // Add participant if not exists
        let pIndex = room.participants.findIndex(p => p.id === userId);
        if (pIndex === -1) {
          room.participants.push({ id: userId, score: 0 });
          await room.save();
        }

        // Return current state to the user
        let currentQuestion = null;
        if (room.currentQuestionIndex >= 0 && room.currentQuestionIndex < room.questions.length) {
          const q = room.questions[room.currentQuestionIndex];
          // Strip correct answer for participants
          currentQuestion = {
            _id: q._id,
            type: q.type,
            text: q.text,
            options: q.options,
            timeLimit: q.timeLimit
          };
        }

        callback({
          success: true,
          status: room.status,
          currentQuestion,
          showResults: room.showResults,
          roomName: room.name
        });
        
        // Notify admin of participant count
        io.to(`admin_${roomCode}`).emit('participant_update', room.participants.length);
        
      } catch (error) {
        callback({ error: error.message });
      }
    });

    // Submit an answer
    socket.on('submit_answer', async ({ roomCode, userId, questionId, selectedOption }, callback) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room) return callback({ error: 'Room not found' });

        if (room.status !== 'active') return callback({ error: 'No active question' });

        const question = room.questions.find(q => q._id.toString() === questionId);
        if (!question) return callback({ error: 'Question not found' });

        // Check if user already answered this
        const alreadyAnswered = room.responses.find(r => r.userId === userId && r.questionId.toString() === questionId);
        if (alreadyAnswered) return callback({ error: 'Already answered' });

        let isCorrect = false;
        if (question.type === 'quiz') {
          isCorrect = (selectedOption === question.correctAnswer);
        }

        room.responses.push({
          userId,
          questionId,
          selectedOption,
          isCorrect
        });

        if (isCorrect) {
          const p = room.participants.find(p => p.id === userId);
          if (p) p.score += 10; // score allocation
        }

        await room.save();
        
        // Let admin know response count updated
        const responsesForQ = room.responses.filter(r => r.questionId.toString() === questionId);
        io.to(`admin_${roomCode}`).emit('responses_update', responsesForQ);

        callback({ success: true, isCorrect });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    // ----- ADMIN EVENTS -----
    
    // Admin joins room control
    socket.on('admin_join', async ({ roomCode }, callback) => {
      socket.join(`admin_${roomCode}`);
      try {
        const room = await Room.findOne({ roomCode });
        if (room) {
          callback({
            participantsCount: room.participants.length,
            responses: room.responses
          });
        }
      } catch (ex) {
        console.error(ex);
      }
    });

    // Admin starts session
    socket.on('admin_start_session', async ({ roomCode }, callback) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (room) {
          room.status = 'active';
          if (room.currentQuestionIndex === -1) {
            room.currentQuestionIndex = 0;
          }
          room.showResults = false;
          await room.save();
          
          const q = room.questions[room.currentQuestionIndex];
          const currentQuestion = {
            _id: q._id,
            type: q.type,
            text: q.text,
            options: q.options,
            timeLimit: q.timeLimit
          };

          io.to(roomCode).emit('new_question', currentQuestion);
          callback({ success: true });
        }
      } catch (ex) {
        callback({ error: ex.message });
      }
    });

    // Admin pushes next question
    socket.on('admin_next_question', async ({ roomCode, index }, callback) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (room) {
          room.currentQuestionIndex = index;
          room.showResults = false;
          await room.save();

          const q = room.questions[index];
          const currentQuestion = {
            _id: q._id,
            type: q.type,
            text: q.text,
            options: q.options,
            timeLimit: q.timeLimit
          };

          io.to(roomCode).emit('new_question', currentQuestion);
          callback({ success: true });
        }
      } catch (ex) {
        callback({ error: ex.message });
      }
    });

    // Admin shows results
    socket.on('admin_show_results', async ({ roomCode }, callback) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (room) {
          room.showResults = true;
          await room.save();
          
          const questionId = room.questions[room.currentQuestionIndex]._id;
          const responses = room.responses.filter(r => r.questionId.toString() === questionId.toString());
          
          io.to(roomCode).emit('show_results', { responses, correctAnswer: room.questions[room.currentQuestionIndex].correctAnswer });
          callback({ success: true });
        }
      } catch (ex) {
         callback({ error: ex.message });
      }
    });

    // Admin ends session
    socket.on('admin_end_session', async ({ roomCode }, callback) => {
      try {
         const room = await Room.findOne({ roomCode });
         if (room) {
           room.status = 'finished';
           await room.save();
           
           // Return top participants
           const leaderboard = room.participants.sort((a,b) => b.score - a.score).slice(0, 10);
           io.to(roomCode).emit('session_ended', leaderboard);
           callback({ success: true });
         }
      } catch (ex) {
         callback({ error: ex.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
