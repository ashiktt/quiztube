import { LectureStudySet } from '@/types';

export const SAMPLE_STUDY_SET: LectureStudySet = {
  id: 'sample-mit-intro-dl',
  createdAt: new Date().toISOString(),
  videoUrl: 'https://www.youtube.com/watch?v=7sB052Pz0sU',
  videoId: '7sB052Pz0sU',
  videoTitle: 'MIT 6.S191: Introduction to Deep Learning (Foundations)',
  channelTitle: 'Alexander Amini (MIT)',
  thumbnailUrl: 'https://img.youtube.com/vi/7sB052Pz0sU/hqdefault.jpg',
  durationFormatted: '45:10',
  difficulty: 'medium',
  overallSummary: `This foundational lecture introduces Deep Learning, neural networks, and the core mathematical principles behind artificial intelligence. It explains how individual perceptrons take weighted linear combinations of inputs and apply non-linear activation functions (such as Sigmoid, ReLU, and Tanh) to learn complex data representations.

The lecture then delves into multi-layer perceptrons (feedforward networks), loss functions (like Cross-Entropy and Mean Squared Error), and the backpropagation algorithm. Through gradient descent, neural networks iteratively adjust their weights and biases to minimize prediction errors, enabling breakthroughs in computer vision, natural language processing, and robotics.`,
  keyTakeaways: [
    'A single Perceptron calculates a weighted dot product of inputs plus a bias term, passed through a non-linear activation function.',
    'Non-linear activation functions (ReLU, Sigmoid, GELU) are mandatory; without them, stacking 100 layers would just reduce to a single linear transformation.',
    'Loss functions quantify the discrepancy between the network prediction y_hat and the ground-truth label y.',
    'Gradient Descent computes the partial derivatives of the loss with respect to every weight using the Chain Rule (Backpropagation).',
    'Learning Rate is a critical hyperparameter: too high causes divergence/oscillation, too low leads to agonizingly slow convergence or local minima traps.',
    'Modern deep learning utilizes Batch Normalization, Dropout, and Adam Optimizer to stabilize and accelerate training on massive datasets.',
  ],
  chapters: [
    {
      title: 'Course Overview & What is Deep Learning?',
      timestampFormatted: '01:15',
      timestampSeconds: 75,
      summary: 'Distinction between traditional hand-crafted feature engineering and representation learning with deep neural networks.',
    },
    {
      title: 'The Artificial Neuron (Perceptron)',
      timestampFormatted: '05:30',
      timestampSeconds: 330,
      summary: 'Mathematical formulation of the perceptron: inputs, weights, bias, dot product, and activation functions.',
    },
    {
      title: 'Activation Functions: Why Non-Linearity Matters',
      timestampFormatted: '11:45',
      timestampSeconds: 705,
      summary: 'Comparison of Sigmoid, Tanh, and Rectified Linear Unit (ReLU), and proving why linear layers cannot learn XOR.',
    },
    {
      title: 'Neural Network Architecture & Stacking Layers',
      timestampFormatted: '18:20',
      timestampSeconds: 1100,
      summary: 'How hidden layers build hierarchical representations from low-level edges to high-level semantic concepts.',
    },
    {
      title: 'Loss Functions & Error Quantification',
      timestampFormatted: '25:10',
      timestampSeconds: 1510,
      summary: 'Cross-Entropy loss for classification and Mean Squared Error for regression tasks.',
    },
    {
      title: 'Gradient Descent & Backpropagation via Chain Rule',
      timestampFormatted: '32:40',
      timestampSeconds: 1960,
      summary: 'Propagating loss backwards through the network to calculate parameter gradients and update weights.',
    },
  ],
  questions: [
    {
      id: 'q-1',
      question: 'What is the primary mathematical reason why non-linear activation functions are required between hidden layers in a deep neural network?',
      options: [
        'To speed up GPU matrix multiplication during forward pass',
        'Without non-linearities, stacking multiple layers mathematically collapses into a single linear regression',
        'To ensure the gradients never become zero during backpropagation',
        'To eliminate the need for bias parameters in each artificial neuron',
      ],
      correctIndex: 1,
      explanation:
        'A composition of linear functions is always strictly linear: f(g(x)) = W2(W1*x + b1) + b2 = (W2*W1)x + (W2*b1 + b2). Without non-linear activations, adding 100 hidden layers provides no greater representational power than a single 1-layer linear model.',
      optionExplanations: [
        'Incorrect. Activation functions slightly increase computation time, not speed up matrix multiplications.',
        'Correct! Matrix multiplication of linear layers collapses algebraically into a single linear transformation.',
        'Incorrect. In fact, functions like Sigmoid can suffer from vanishing gradients.',
        'Incorrect. Bias parameters are still necessary with or without non-linearities to shift decision boundaries.',
      ],
      hint: 'Think about what happens algebraically when you compose two linear equations: y = a*(b*x + c) + d.',
      timestampFormatted: '11:45',
      timestampSeconds: 705,
      topicTag: 'Activation Functions',
      difficulty: 'medium',
      bloomsLevel: 'Understanding',
    },
    {
      id: 'q-2',
      question: 'In the perceptron formulation ŷ = g(wᵀx + b), what role does the bias term "b" serve?',
      options: [
        'It scales the input vector magnitudes to normalize variances',
        'It prevents the activation function from saturating at extreme values',
        'It shifts the activation function / decision boundary independently of the input values',
        'It acts as the learning rate decay parameter during backpropagation',
      ],
      correctIndex: 2,
      explanation:
        'The bias term b shifts the entire linear hyper-plane (wᵀx + b = 0) away from the origin. Without a bias term, the decision boundary would always be constrained to pass directly through the origin (0, 0...0).',
      optionExplanations: [
        'Incorrect. Normalization layers (like Batch Norm) scale variances, not the bias parameter.',
        'Incorrect. The bias shifts the input, but doesn’t fundamentally bound the activation function.',
        'Correct! The bias allows the decision boundary to translate along the coordinate axes independently of inputs.',
        'Incorrect. Learning rate schedules are optimization hyperparameters, not model parameters.',
      ],
      hint: 'Consider a 2D line y = mx + c. What does "c" allow the line to do that y = mx cannot?',
      timestampFormatted: '06:15',
      timestampSeconds: 375,
      topicTag: 'Perceptron Fundamentals',
      difficulty: 'easy',
      bloomsLevel: 'Recall',
    },
    {
      id: 'q-3',
      question: 'Which loss function is best suited when training a neural network for multi-class classification where classes are mutually exclusive?',
      options: [
        'Mean Squared Error (MSE)',
        'Categorical Cross-Entropy Loss with Softmax',
        'Binary Cross-Entropy with Linear Activation',
        'Hinge Loss with Sigmoid',
      ],
      correctIndex: 1,
      explanation:
        'Categorical Cross-Entropy paired with Softmax activation computes the negative log likelihood of the true probability distribution versus predicted probabilities, penalizing confident incorrect classifications exponentially.',
      optionExplanations: [
        'Incorrect. MSE is typically used for continuous regression, not multi-class probability estimation.',
        'Correct! Softmax converts logits to a valid probability distribution summing to 1, and Cross-Entropy minimizes divergence.',
        'Incorrect. Binary Cross-Entropy is used for 2-class or multi-label problems, not mutually exclusive multi-class.',
        'Incorrect. Hinge loss is typically used with Support Vector Machines (SVMs) for margin maximization.',
      ],
      hint: 'Look for the standard probabilistic loss function combined with the probability normalization function.',
      timestampFormatted: '25:10',
      timestampSeconds: 1510,
      topicTag: 'Loss Functions',
      difficulty: 'medium',
      bloomsLevel: 'Application',
    },
    {
      id: 'q-4',
      question: 'During Gradient Descent, if the learning rate η is set excessively high, what failure mode is most likely to occur?',
      options: [
        'The weights will permanently freeze and gradients will reach zero on the first step',
        'The loss will diverge or oscillate wildly without ever converging to a minimum',
        'The model will automatically switch from Gradient Descent to Newton-Raphson optimization',
        'The network will instantly overfit the training dataset in one epoch',
      ],
      correctIndex: 1,
      explanation:
        'When the learning rate is too large, the weight update step overshoots the minimum of the loss valley, jumping to steeper regions on the opposite side. This causes the loss to oscillate with increasing amplitude and explode towards infinity (divergence).',
      optionExplanations: [
        'Incorrect. Gradients become zero at saddle points/minima, not from high learning rates.',
        'Correct! An excessively large step size overshoots the minimum and causes mathematical divergence.',
        'Incorrect. Optimizers do not magically alter their algorithmic formulation.',
        'Incorrect. Overfitting requires fitting training data closely, whereas a diverging model learns nothing meaningful.',
      ],
      hint: 'Imagine trying to walk down a narrow steep valley, but every step you take is 100 meters wide.',
      timestampFormatted: '33:15',
      timestampSeconds: 1995,
      topicTag: 'Optimization & Gradient Descent',
      difficulty: 'easy',
      bloomsLevel: 'Understanding',
    },
    {
      id: 'q-5',
      question: 'How does Backpropagation calculate the gradient of the loss with respect to weights in early layers of a deep network?',
      options: [
        'By applying numerical finite-difference approximations at every neuron',
        'By using the Calculus Chain Rule recursively from output back to input',
        'By randomly perturbing weights and selecting the ones that reduce training error',
        'By converting all weights into Fourier transform coefficients',
      ],
      correctIndex: 1,
      explanation:
        'Backpropagation is an efficient implementation of the Calculus Chain Rule. It computes ∂L/∂w by taking the product of partial derivatives backward through each connected layer, reusing intermediate values to achieve linear computational complexity O(W).',
      optionExplanations: [
        'Incorrect. Numerical finite-differences require O(W²) forward passes, which is computationally intractable.',
        'Correct! Backprop recursively multiplies Jacobians/derivatives using the chain rule from output to input.',
        'Incorrect. Random perturbation describes Genetic Algorithms or Monte Carlo sampling, not Backprop.',
        'Incorrect. Fourier transforms are not used to calculate analytic parameter gradients in backprop.',
      ],
      hint: 'Recall Leibniz notation for composite functions: dy/dx = (dy/du) * (du/dx).',
      timestampFormatted: '36:45',
      timestampSeconds: 2205,
      topicTag: 'Backpropagation',
      difficulty: 'hard',
      bloomsLevel: 'Analysis',
    },
  ],
  flashcards: [
    {
      id: 'f-1',
      front: 'What is a Perceptron?',
      back: 'The fundamental building block of neural networks: computes a weighted linear combination of inputs (wᵀx + b) and passes it through an activation function.',
      keyTakeaway: 'Output = Activation(Σ wᵢxᵢ + b)',
      timestampFormatted: '05:30',
      timestampSeconds: 330,
      topicTag: 'Neural Architectures',
    },
    {
      id: 'f-2',
      front: 'Why is ReLU (Rectified Linear Unit) widely preferred over Sigmoid in deep networks?',
      back: 'ReLU: f(x) = max(0, x). It does not saturate for positive values (derivative is always 1 for x > 0), which prevents the vanishing gradient problem and enables training very deep architectures.',
      keyTakeaway: 'Constant gradient of 1 for x > 0 prevents vanishing gradients.',
      timestampFormatted: '13:10',
      timestampSeconds: 790,
      topicTag: 'Activation Functions',
    },
    {
      id: 'f-3',
      front: 'What is Backpropagation in Deep Learning?',
      back: 'An algorithmic application of the Chain Rule from calculus that computes the gradient of the loss function with respect to every weight in the network by traversing backwards from output to input.',
      keyTakeaway: 'Chain Rule applied layer-by-layer backwards.',
      timestampFormatted: '32:40',
      timestampSeconds: 1960,
      topicTag: 'Optimization',
    },
    {
      id: 'f-4',
      front: 'What is the Vanishing Gradient Problem?',
      back: 'When using saturating activations (like Sigmoid or Tanh), derivatives in the saturation regions are very small (< 0.25). Multiplying these small fractions across many layers causes gradients to approach zero, preventing early layers from learning.',
      keyTakeaway: 'Small derivatives multiplied across deep layers decay to near zero.',
      timestampFormatted: '15:20',
      timestampSeconds: 920,
      topicTag: 'Training Dynamics',
    },
    {
      id: 'f-5',
      front: 'What is the Softmax function and where is it used?',
      back: 'Softmax exponentiates and normalizes an input vector of raw scores (logits) into a probability distribution where all values are between 0 and 1 and sum to 1. Used in the output layer for multi-class classification.',
      keyTakeaway: 'P(y=i) = e^(z_i) / Σ e^(z_j)',
      timestampFormatted: '26:40',
      timestampSeconds: 1600,
      topicTag: 'Probability & Output Layers',
    },
  ],
  cheatsheet: {
    title: 'MIT 6.S191: Deep Learning Foundations Visual Cheatsheet',
    subtitle: 'Neural Architectures, Activation Functions, Loss Formulations & Backpropagation Mechanics',
    heroImageUrl: 'https://img.youtube.com/vi/7sB052Pz0sU/maxresdefault.jpg',
    coreFormulas: [
      {
        label: 'Perceptron Output Formulation',
        formula: 'ŷ = g(wᵀx + b) = g(∑ᵢ wᵢxᵢ + b)',
        explanation: 'Dot product of input features x and synaptic weights w, shifted by bias b, passed through non-linear activation function g.',
      },
      {
        label: 'Binary & Categorical Cross-Entropy Loss',
        formula: 'L(y, ŷ) = - ∑ᵢ yᵢ log(ŷᵢ)',
        explanation: 'Measures divergence between ground-truth one-hot label vector y and predicted probabilities ŷ.',
      },
      {
        label: 'Gradient Descent Weight Update',
        formula: 'w_{t+1} = w_t - η ∇_w L(w_t)',
        explanation: 'Parameters step opposite to the gradient vector scaled by learning rate η.',
      },
      {
        label: 'Calculus Chain Rule (Backpropagation)',
        formula: '∂L/∂w₁ = (∂L/∂ŷ) · (∂ŷ/∂z) · (∂z/∂w₁)',
        explanation: 'Decomposes gradient of loss with respect to early weights through composite layers.',
      },
    ],
    flowchart: {
      title: 'Neural Network Forward Pass & Backprop Loop',
      mermaidCode: `graph LR
    X["Input Vector x"] -->|"Dot Product wᵀx + b"| Z["Pre-activation z"]
    Z -->|"Non-linear g(z)"| Y["Prediction ŷ"]
    Y -->|"Compare with y"| L["Loss Function L(y, ŷ)"]
    L -.->|"Chain Rule ∂L/∂w"| BP["Backpropagation"]
    BP -.->|"Update w ← w - η∇L"| X`,
      description: 'End-to-end training cycle from input features through non-linear activations to loss computation and gradient backpropagation.',
    },
    comparisonTable: {
      title: 'Activation Function Comparison Matrix',
      headers: ['Function', 'Mathematical Formula', 'Output Range', 'Pros', 'Cons / Pitfalls'],
      rows: [
        ['Sigmoid σ(z)', '1 / (1 + e⁻ᶻ)', '(0, 1)', 'Smooth probability interpretation', 'Vanishing gradients at saturation'],
        ['Tanh(z)', '(eᶻ - e⁻ᶻ) / (eᶻ + e⁻ᶻ)', '(-1, 1)', 'Zero-centered gradients', 'Still saturates for |z| >> 0'],
        ['ReLU', 'max(0, z)', '[0, ∞)', 'Fast to compute, constant gradient 1 for z>0', 'Dying ReLU problem for z < 0'],
        ['Softmax', 'e^(z_i) / ∑ e^(z_j)', '(0, 1), sum=1', 'Ideal for multi-class probability outputs', 'Computationally expensive on large vocabularies'],
      ],
    },
    sections: [
      {
        title: '1. The Artificial Neuron (Perceptron)',
        keyPoints: [
          'Inputs x₁, x₂... are multiplied by weights w₁, w₂...',
          'Bias b translates the decision boundary away from the origin.',
          'Linear combination alone cannot solve non-linear problems like XOR.',
        ],
        formulaOrCode: 'z = w1*x1 + w2*x2 + b\noutput = activation(z)',
        timestampFormatted: '05:30',
        timestampSeconds: 330,
      },
      {
        title: '2. Gradient Descent & Learning Rates',
        keyPoints: [
          'Small learning rate: Slow training, risk of getting stuck in local minima.',
          'Large learning rate: Overshoots minima, causes loss to diverge to infinity.',
          'Adaptive optimizers (Adam, RMSprop) scale step sizes dynamically per parameter.',
        ],
        formulaOrCode: 'learning_rate_schedule: Adam(lr=0.001, beta1=0.9, beta2=0.999)',
        timestampFormatted: '33:15',
        timestampSeconds: 1995,
      },
    ],
    pitfalls: [
      {
        misconception: 'Stacking 100 purely linear layers will create a deep complex model.',
        correctFact: 'A composition of linear functions is always just a single linear transformation (W2*W1*x = W_combined*x).',
        whyItMatters: 'Without non-linear activations, depth provides zero extra representational capacity.',
      },
      {
        misconception: 'Initializing all network weights to zero is a good starting point.',
        correctFact: 'Zero initialization causes all neurons in a layer to compute identical gradients (Symmetry problem).',
        whyItMatters: 'Always use Xavier/Glorot or He random initialization to break symmetry.',
      },
    ],
  },
};
