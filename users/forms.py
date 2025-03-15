from django import forms


class LoginForm(forms.Form):
    username = forms.CharField(label='Username', max_length=32, widget=forms.TextInput(attrs={
        'class': 'input', 'placeholder': 'Username/Email'
    }))
    password = forms.CharField(label='Password', min_length=6, widget=forms.PasswordInput(attrs={
        'class': 'input', 'placeholder': 'Password'}))

    def clean_password(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if username == password:
            raise forms.ValidationError('Username and password can\'t be the same！')
        return password
