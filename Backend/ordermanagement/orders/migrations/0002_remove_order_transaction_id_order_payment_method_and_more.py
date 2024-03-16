# Generated by Django 5.0 on 2024-03-16 18:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='order',
            name='transaction_id',
        ),
        migrations.AddField(
            model_name='order',
            name='payment_method',
            field=models.CharField(max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='order',
            name='order_status',
            field=models.CharField(max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='order',
            name='shipping_address',
            field=models.CharField(max_length=200, null=True),
        ),
    ]
