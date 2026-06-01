from django.urls import path
from . import views

urlpatterns = [
    path('improve-cv/', views.improve_cv, name='improve_cv'),
    path('extract-resume/', views.extract_resume, name='extract_resume'),
    path('extract-resume-ai/', views.extract_resume_ai, name='extract_resume_ai'),
    path('validate-and-merge/', views.validate_and_merge, name='validate_and_merge'),
]
