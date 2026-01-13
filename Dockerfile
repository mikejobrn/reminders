FROM node:24

RUN apt-get update && \
    apt-get install -y \
        git \
        openssh-client \
        bash-completion \
        vim

# Modifica terminal padrão dos usuários para bash em vez do sh
RUN sed -i 's#/bin/sh#/bin/bash#g' /etc/passwd && \
    # Adiciona cores no prefixo do terminal
    echo 'force_color_prompt=yes' >> ~/.bashrc && \
    echo 'if [ "$force_color_prompt" = yes ]; then' >> ~/.bashrc && \
    echo 'PS1="\\[\\e[01;32m\\]\\u@\\h\\[\\e[00m\\]:\\[\\e[01;34m\\]\\w\\[\\e[00m\\]\\$ "' >> ~/.bashrc && \
    echo 'fi' >> ~/.bashrc && \
    # Habilita bash completion do Git
    echo 'source /etc/bash_completion' >> ~/.bashrc

WORKDIR /var/www

EXPOSE 3000

CMD ["/bin/bash"]
