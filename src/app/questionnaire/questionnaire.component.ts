import { Component, OnInit } from '@angular/core';
import { QuestionService } from '../question.service';

@Component({
  selector: 'app-questionnaire',
  standalone: false,
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss'
})
export class QuestionnaireComponent implements OnInit {
  currentQuestion: any;
  selectedOption: any = null; // For radio button selections
  selectedOptions: any[] = []; // For checkbox selections
  isLoading = true;
  error: string | null = null;
  history: number[] = [];
  totalQuestions = 0; // Total number of questions in the flow
  currentQuestionIndex = 0; // Index of the current question
  finalUrl: string | null = null;

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    this.loadQuestion(1000); // Start with the initial question (ID 1000)
  }

  loadQuestion(questionId: number, isBackNavigation: boolean = false): void {
    this.isLoading = true;
    this.error = null;

    this.questionService.getQuestionById(questionId).subscribe({
      next: (data) => {
          if (this.currentQuestion && !isBackNavigation) {
          // Push the current question ID to the history
          this.history.push(this.currentQuestion.Id);
        }
        this.currentQuestion = data;
        this.selectedOption = null;
        this.selectedOptions = [];
         // Update progress tracking
        this.currentQuestionIndex = this.history.length + 1; // Current question index
        this.totalQuestions = this.totalQuestions || 10;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching question:', err);
        this.error = 'Sorry, we cannot load a question.';
        alert(this.error);
        this.isLoading = false;
      },
    });
  }

  getProgressValue(): number {
    // Calculate progress as a percentage
    return (this.currentQuestionIndex / this.totalQuestions) * 100;
  }

  toggleSelection(option: any): void {
    const index = this.selectedOptions.findIndex((o) => o.Id === option.Id);
    if (index > -1) {
      this.selectedOptions.splice(index, 1); // Remove if already selected
    } else {
      this.selectedOptions.push(option); // Add if not selected
    }
  }

  isSelectionValid(): boolean {
    if (this.currentQuestion.QuestionSelectType === 0) {
      return !!this.selectedOption; // Valid if one radio option is selected
    }
    if (this.currentQuestion.QuestionSelectType === 1) {
      return this.selectedOptions.length > 0 || this.currentQuestion.IsOptional; // Valid if at least one checkbox is selected or question is optional
    }
    return false;
  }

  // proceed(): void {
  //   if (this.currentQuestion.QuestionSelectType === 0) {
  //     this.onOptionSelect(this.selectedOption);
  //   } else if (this.currentQuestion.QuestionSelectType === 1) {
  //     // Handle checkbox selection
  //     this.selectedOptions.forEach((option) => this.onOptionSelect(option));
  //   }
  // }

  proceed(): void {
  if (this.currentQuestion.QuestionSelectType === 0) {
    // Single selection (radio)
    this.onOptionSelect(this.selectedOption);
  } else if (this.currentQuestion.QuestionSelectType === 1) {
    // Multiple selections (checkboxes)
    if (this.selectedOptions.length > 0) {
      this.selectedOptions.forEach((option) => this.onOptionSelect(option));
    } else if (this.currentQuestion.IsOptional) {
      // Proceed without selection if the question is optional
      this.finalUrl = this.constructFinalUrl();
    }
  }
}


  onOptionSelect(option: any): void {
    if (option.Action === 'GoToQuestion' && option.GoToQuestionId) {
      this.loadQuestion(option.GoToQuestionId); // Fetch and load the next question
    } else if (option.Action === 'GoToUrl') {
      // Construct the final URL
      this.finalUrl = this.constructFinalUrl(); // Set the final URL
      // const constructedUrl = this.constructFinalUrl();
      // console.log('Final URL:', constructedUrl);
      // window.location.href = constructedUrl;
    }
  }

  constructFinalUrl(): string {
    const baseUrl = 'https://www.doctoranytime.gr/s/Psychologos?';
    const queryParams: { [key: string]: string[] } = {};

    // Build query parameters
    const allOptions = this.selectedOptions.concat(this.selectedOption ? [this.selectedOption] : []);
    allOptions.forEach((option) => {
      if (option.FilterQueryStringKey && option.FilterQueryStringValue) {
        const key = option.FilterQueryStringKey;
        const value = option.FilterQueryStringValue;

        if (!queryParams[key]) {
          queryParams[key] = [];
        }
        queryParams[key].push(value);
      }
    });

    // Construct query string
    const queryString = Object.entries(queryParams)
      .map(([key, values]) => `${key}=${values.join('_and_')}`)
      .join('&');

    return baseUrl + queryString;
  }

  goBack(): void {
  if (this.history.length > 0) {
    const previousQuestionId = this.history.pop(); // Get the last question ID from history
    if (previousQuestionId !== undefined) {
      this.currentQuestionIndex = Math.max(this.currentQuestionIndex - 1, 1); // Decrement progress
      this.loadQuestion(previousQuestionId, true); // Load the previous question (indicating "back")
      this.finalUrl = null;
    }
  }
}
}
