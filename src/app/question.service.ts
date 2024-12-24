import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Question {
  Id: number;
  Question: string;
  Options: Array<{
    Id: number;
    Answer: string;
    GoToQuestionId?: number | null;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private apiUrl = '/searchq/GetQuestions?version=v2';

  constructor(private http: HttpClient) {}

  getQuestionById(questionId: number): Observable<Question> {
  return this.http.get<any>(this.apiUrl, { observe: 'response' }).pipe(
    map((response) => {
      console.log('Full HTTP Response:', response);
      if (response.body && response.body.Data) {
        return response.body.Data.find((q: any) => q.Id === questionId);
      }
      return undefined;
    })
  );
}
}
