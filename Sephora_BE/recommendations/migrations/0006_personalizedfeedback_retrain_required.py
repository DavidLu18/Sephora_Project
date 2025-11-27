from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recommendations", "0005_personalizedfeedback"),
    ]

    operations = [
        migrations.AddField(
            model_name="personalizedfeedback",
            name="retrain_required",
            field=models.BooleanField(default=False),
        ),
    ]


