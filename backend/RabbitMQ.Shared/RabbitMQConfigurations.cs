﻿using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RabbitMQ.Client;
using RabbitMQ.Shared.Interfaces;
using RabbitMQ.Shared.QueueServices;
using System;

namespace RabbitMQ.Shared
{
    public static class RabbitMQConfigurations
    {
        public static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IMessageProducerScopeFactory, MessageProducerScopeFactory>();
            services.AddSingleton<IMessageConsumerScopeFactory, MessageConsumerScopeFactory>();

            RegisterConnectionFactory(services, configuration);
        }

        public static void Configure(IApplicationBuilder app, IHostingEnvironment env) 
        {

        }

        private static void RegisterConnectionFactory(IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IConnectionFactory>(x => new ExtendedConnectionFactory(new Uri(configuration.GetSection("RabbitMQ").Value)));
        }
    }
}
