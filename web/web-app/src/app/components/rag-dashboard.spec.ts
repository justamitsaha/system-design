import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RagDashboard } from './rag-dashboard';

describe('RagDashboard', () => {
  let component: RagDashboard;
  let fixture: ComponentFixture<RagDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RagDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RagDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
