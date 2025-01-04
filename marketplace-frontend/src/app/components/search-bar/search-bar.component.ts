import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit {
  @Output() search = new EventEmitter<string>();
  searchTerm = '';

  constructor() { }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.search.emit(this.searchTerm ? this.searchTerm.trim() : '');
  }

  ngOnInit(): void {
  }

}
